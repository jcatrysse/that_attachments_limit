module ThatAttachmentsLimit
  # At the bottom of the body, so that the plugin's addFile and uploadAndAttachFiles replace the
  # core ones: core attachments.js is added to the head by the attachments form.
  class Hooks < Redmine::Hook::ViewListener
    render_on :view_layouts_base_body_bottom, :partial => 'hooks/that_attachments_limit/limit_script'
  end
end
