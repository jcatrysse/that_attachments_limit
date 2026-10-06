function addFile(inputEl, file, eagerUpload) {
    var attachmentsForm = $(inputEl).closest('.attachments_form');
    var attachmentsFields = attachmentsForm.find('.attachments_fields');
    var attachmentsIcons = attachmentsForm.find('.attachments_icons');
    var addAttachment = attachmentsForm.find('.add_attachment');
    var maxFiles = ($(inputEl).attr('multiple') == 'multiple' ? window.maxFileUploads : 1);
    var delIcon = attachmentsIcons.find('svg.svg-del').clone();
    var attachmentIcon = attachmentsIcons.find('svg.svg-attachment').clone();

    if (attachmentsFields.children().length < maxFiles) {
        var attachmentId = addFile.nextAttachmentId++;
        var fileSpan = $('<span>', { id: 'attachments_' + attachmentId });
        var param = $(inputEl).data('param');
        if (!param) { param = 'attachments'};

        fileSpan.append(
            attachmentIcon,
            $('<input>', { type: 'text', 'class': 'icon icon-attachment filename readonly', name: param +'[' + attachmentId + '][filename]', readonly: 'readonly' }).val(file.name),
            $('<input>', { type: 'text', 'class': 'description', name: param + '[' + attachmentId + '][description]', maxlength: 255, placeholder: $(inputEl).data('description-placeholder') }).toggle(!eagerUpload),
            $('<input>', { type: 'hidden', 'class': 'token', name: param + '[' + attachmentId + '][token]' }),
            $('<a>', { href: "#", 'class': 'icon-only icon-del remove-upload' }).append(delIcon).click(removeFile).toggle(!eagerUpload)
        ).appendTo(attachmentsFields);

        if ($(inputEl).data('description') == 0) {
            fileSpan.find('input.description').remove();
        }

        if (eagerUpload) {
            ajaxUpload(file, attachmentId, fileSpan, inputEl);
        }

        addAttachment.toggle(attachmentsFields.children().length < maxFiles);
        return attachmentId;
    }
    return null;
}

addFile.nextAttachmentId = 1;

function uploadAndAttachFiles(files, inputEl) {

    var maxFileSize = $(inputEl).data('max-file-size');
    var maxFileSizeExceeded = $(inputEl).data('max-file-size-message');

    var sizeExceeded = false;
    var filesLength = $(inputEl).closest('.attachments_form').find('.attachments_fields').children().length + files.length
    $.each(files, function() {
        if (this.size && maxFileSize != null && this.size > parseInt(maxFileSize)) {sizeExceeded=true;}
    });
    if (sizeExceeded) {
        window.alert(maxFileSizeExceeded);
    } else {
        $.each(files, function() {addFile(inputEl, this, true);});
    }

    if (filesLength > ($(inputEl).attr('multiple') == 'multiple' ? window.maxFileUploads : 1)) {
        window.alert($(inputEl).data('max-number-of-files-message'));
    }
    return sizeExceeded;
}