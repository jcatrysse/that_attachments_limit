# Plugin data for the end-to-end run: a limit of 3, so the limit is easy to hit.
settings = Setting.plugin_that_attachments_limit || {}
Setting.plugin_that_attachments_limit = settings.merge('attachments_limit' => '3')

# A single-file input (attachment custom field, multiple: false), only in the private project so
# the forms of the other scenarios keep one file input.
unless IssueCustomField.exists?(name: 'E2E single file')
  IssueCustomField.create!(name: 'E2E single file', field_format: 'attachment', is_for_all: false,
                           visible: true, trackers: Tracker.all,
                           projects: [Project.find_by!(identifier: 'e2e-private')])
end
