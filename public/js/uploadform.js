var UploadForm = function(options) {
  var status_update, uploading;
  var upload_form = $('#' + options.uploadForm);
  var update_form = $("#"+options.updateForm);
  var save_button = update_form.find('button[type=submit]')
  var iframe = upload_form.find('iframe');
  var file_field = upload_form.find('input[type=file]');
  var status = $('#' + options.statusId);

  var setProgress = function(progress) {
    upload_form.find('.progress .bar').css('width', progress + "%");
  }

  var disableSaveButton = function() {
    save_button.attr("disabled", "disabled");
  }

  disableSaveButton();

  file_field.change(function() {
    uploading=true;
    disableSaveButton();
    upload_form.submit();

    status_update = setInterval(function() {
      $.ajax({
        url: options.progressPath,
        success: function(data) {
          setProgress(data.progress);
          if(uploading) status.text("Status: " + data.progress + "%");
        }
      })
    }, 500)
  });

  iframe.load(function() {
    var path = iframe.contents().find('body').text();

    uploading=false;
    clearInterval(status_update);
    save_button.removeAttr("disabled");
    setProgress(100);
    status.html("Status 100%. <a href=\""  + path + "\">uploaded to here.</a>");
  });
}