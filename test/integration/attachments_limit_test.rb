require File.expand_path('../../../../../test/test_helper', __FILE__)

class AttachmentsLimitTest < Redmine::IntegrationTest
  fixtures :projects, :users, :email_addresses, :roles, :members, :member_roles,
           :trackers, :projects_trackers, :enabled_modules, :issue_statuses,
           :enumerations, :workflows, :wikis, :wiki_pages, :wiki_contents

  def setup
    @original = Setting.plugin_that_attachments_limit
    Role.find(1).add_permission! :add_issues
    Role.find(1).add_permission! :edit_wiki_pages
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
end
