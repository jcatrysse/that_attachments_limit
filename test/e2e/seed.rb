# Plugin data for the end-to-end run: a limit of 3, so the limit is easy to hit.
settings = Setting.plugin_that_attachments_limit || {}
Setting.plugin_that_attachments_limit = settings.merge('attachments_limit' => '3')
