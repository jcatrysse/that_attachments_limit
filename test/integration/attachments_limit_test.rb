require File.expand_path('../../../../../test/test_helper', __FILE__)

class AttachmentsLimitTest < Redmine::IntegrationTest
  fixtures :projects, :users, :email_addresses, :roles, :members, :member_roles,
           :trackers, :projects_trackers, :enabled_modules, :issue_statuses,
           :enumerations, :workflows, :wikis, :wiki_pages, :wiki_contents,
           :issues, :journals, :news, :documents, :boards, :messages, :custom_fields,
           :custom_fields_projects, :custom_fields_trackers

  def setup
    @original = Setting.plugin_that_attachments_limit
    Role.find(1).add_permission! :add_issues
    Role.find(1).add_permission! :edit_wiki_pages
    grant_view_issue_description(Role.find(1))
  end

  # redmine_view_issue_description (installed at GEOxyz) refuses the issue page to roles without
  # its permission; the fixture roles do not have it.
  def grant_view_issue_description(*roles)
    return unless Redmine::Plugin.installed?(:redmine_view_issue_description)

    roles.each { |role| role.add_permission! :view_issue_description }
  end

  def teardown
    Setting.plugin_that_attachments_limit = @original
  end

  def set_limit(value)
    Setting.plugin_that_attachments_limit = { 'attachments_limit' => value }
  end

  def test_new_issue_form_gets_the_configured_limit_and_the_script
    set_limit('3')
    log_user('jsmith', 'jsmith')
    get '/projects/ecookbook/issues/new'
    assert_response :success
    assert_select 'script', :text => /var maxFileUploads = 3;/
    assert_select 'script[src*=?]', 'plugin_assets/that_attachments_limit/attachments'
    assert_select '.attachments_form .attachments_icons'
  end

  def test_wiki_edit_form_gets_the_configured_limit
    set_limit('25')
    log_user('jsmith', 'jsmith')
    get '/projects/ecookbook/wiki/CookBook_documentation/edit'
    assert_response :success
    assert_select 'script', :text => /var maxFileUploads = 25;/
  end

  def test_invalid_limits_fall_back_to_10
    log_user('jsmith', 'jsmith')
    ['', '0', '-4', 'abc', nil].each do |value|
      set_limit(value)
      get '/projects/ecookbook/issues/new'
      assert_response :success
      assert_select 'script', {:text => /var maxFileUploads = 10;/}, "value #{value.inspect}"
    end
  end

  def test_missing_setting_falls_back_to_10
    Setting.plugin_that_attachments_limit = {}
    log_user('jsmith', 'jsmith')
    get '/projects/ecookbook/issues/new'
    assert_response :success
    assert_select 'script', :text => /var maxFileUploads = 10;/
  end

  def test_limit_is_always_rendered_as_an_integer
    set_limit('5</script><script>alert(1)')
    log_user('jsmith', 'jsmith')
    get '/projects/ecookbook/issues/new'
    assert_response :success
    assert_select 'script', :text => /var maxFileUploads = 5;/
    assert_not_includes response.body, 'alert(1)'
  end

  def test_admin_can_configure_the_limit
    log_user('admin', 'admin')
    get '/settings/plugin/that_attachments_limit'
    assert_response :success
    assert_select 'input[name=?]', 'settings[attachments_limit]'

    post '/settings/plugin/that_attachments_limit', :params => {:settings => {:attachments_limit => '7'}}
    assert_redirected_to '/settings/plugin/that_attachments_limit'
    assert_equal '7', Setting.plugin_that_attachments_limit['attachments_limit']
  end

  def test_non_admin_cannot_configure_the_limit
    set_limit('3')
    log_user('jsmith', 'jsmith')
    get '/settings/plugin/that_attachments_limit'
    assert_response :forbidden
    post '/settings/plugin/that_attachments_limit', :params => {:settings => {:attachments_limit => '99'}}
    assert_response :forbidden
    assert_equal '3', Setting.plugin_that_attachments_limit['attachments_limit']
  end

  def assert_limit_script_after_core(limit)
    assert_select 'script', :text => /var maxFileUploads = #{limit};/
    core = response.body.index(%r{<script src="[^"]*/assets/attachments-})
    plugin = response.body.index(%r{<script src="[^"]*/plugin_assets/that_attachments_limit/attachments})
    assert core, 'core attachments.js is not on the page'
    assert plugin, 'the plugin attachments.js is not on the page'
    assert core < plugin, 'the plugin attachments.js must load after core attachments.js'
  end

  def test_issue_pages_are_reachable_for_the_test_role
    log_user('jsmith', 'jsmith')
    ['/issues/1', '/issues/1/edit'].each do |path|
      get path
      assert_response :success, path
    end
  end

  def test_limit_script_loads_after_core_on_every_attachments_form
    set_limit('4')
    log_user('jsmith', 'jsmith')
    [
      '/projects/ecookbook/issues/new',
      '/issues/1',
      '/issues/1/edit',
      '/projects/ecookbook/wiki/CookBook_documentation/edit',
      '/projects/ecookbook/news/new',
      '/projects/ecookbook/documents/new',
      '/documents/1',
      '/boards/1/topics/new',
      '/projects/ecookbook/files/new'
    ].each do |path|
      get path
      assert_response :success, path
      assert_select '.attachments_form input.file_selector', {:minimum => 1}, path
      assert_limit_script_after_core(4)
    end
  end

  def test_custom_field_file_input_keeps_core_drop_target_class
    field = IssueCustomField.create!(:name => 'Attachment field', :field_format => 'attachment',
                                     :is_for_all => true, :tracker_ids => Tracker.pluck(:id))
    log_user('jsmith', 'jsmith')
    get '/projects/ecookbook/issues/new'
    assert_response :success
    assert_select "input.file_selector.custom-field-filedrop[name=?]", "issue[custom_field_values][#{field.id}][dummy][file]"
    assert_select "input.file_selector.custom-field-filedrop:not([multiple])"
    assert_limit_script_after_core(10)
  end

  # Another request in the same process is inside the attachments form while this one renders
  # the issue page. With render_parent (shared PathSet exclusions) this page lost the script.
  def test_limit_script_present_while_another_thread_renders_the_attachments_form
    set_limit('2')
    log_user('jsmith', 'jsmith')
    inside = Queue.new
    release = Queue.new
    blocker = Module.new do
      define_method(:attachment_max_size) do
        if Thread.current[:attachments_limit_block]
          Thread.current[:attachments_limit_block] = false
          inside << true
          release.pop
        end
        super()
      end
    end
    Setting.singleton_class.prepend(blocker)
    other = Thread.new do
      Thread.current[:attachments_limit_block] = true
      ApplicationController.render(:partial => 'attachments/form', :locals => {:container => Issue.new})
    end
    begin
      assert inside.pop(:timeout => 10), 'the other thread never reached the attachments form'
      get '/projects/ecookbook/issues/new'
      assert_response :success
      assert_limit_script_after_core(2)
    ensure
      release << true
      other.join(10)
    end
  end
end
