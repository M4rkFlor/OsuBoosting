/*function userClicked() {


    $.post("/signup", {
        username: $("#username").val(),
        password: $("#psw").val(),
        email: $("#email").val(),
        osu_username: $("#oun").val(),
        osu_password: $("#op").val(),
        country: $("#country").val(),
        state: $("#s").val(),
        city: $("#city").val(),
        zip: $("#z").val()
    }, function (data) {
        if(data.error){
            alert(data.error[0]);
        }
        else
        window.location = data.redirect;
    });

    return false;
}*/
$("form").on('submit',function(e){
    e.preventDefault();
    //ajax code here
     $.post("/signup", {
        username: $("#username").val(),
        password: $("#psw").val(),
        email: $("#email").val(),
        osu_username: $("#oun").val(),
        osu_password: $("#op").val(),
        country: $("#country").val(),
        state: $("#s").val(),
        city: $("#city").val(),
        zip: $("#z").val()
    }, function (data) {
       if(data.error){
           if(data.error[0].param!==undefined&&data.error[0].param!==null)
           $( "#alert" ).append( "<div class='alert alert-danger alert-dismissible fade show' role='alert'> <strong>" + data.error[0].param + "</strong> " + data.error[0].msg + " <button type='button' class='close' data-dismiss='alert' aria-label='Close'> <span aria-hidden='true'>&times;</span></button></div>" );
           else
           $( "#alert" ).append( "<div class='alert alert-danger alert-dismissible fade show' role='alert'> <strong>" + data.error[0] + "</strong> choose a differnt username <button type='button' class='close' data-dismiss='alert' aria-label='Close'> <span aria-hidden='true'>&times;</span></button></div>" );
        }
        else
      window.location = data.redirect;
    });
    event.preventDefault();
    return false;
});

$(document).ready(function () {
    
//vh is not calculated properly and isn't intended to be fixed so always do this
if ($('body').hasClass('mobile')) {
$('.body').css({ height: window.outerHeight});
}
    
    $("#username").keydown(function (event) {
        if (event.which === 13) {
            userClicked();
            event.preventDefault();
            return false;
        }
    });

    $("#psw").keydown(function (event) {
        if (event.which === 13) {
            userClicked();
            event.preventDefault();
            return false;
        }
    });
     $("#email").keydown(function (event) {
        if (event.which === 13) {
            userClicked();
            event.preventDefault();
            return false;
        }
    });
    $("#oun").keydown(function (event) {
        if (event.which === 13) {
            userClicked();
            event.preventDefault();
            return false;
        }
    });
    $("#op").keydown(function (event) {
        if (event.which === 13) {
            userClicked();
            event.preventDefault();
            return false;
        }
    });
    $("#country").keydown(function (event) {
        if (event.which === 13) {
            userClicked();
            event.preventDefault();
            return false;
        }
    });
    $("#s").keydown(function (event) {
        if (event.which === 13) {
            userClicked();
            event.preventDefault();
            return false;
        }
    });
    $("#city").keydown(function (event) {
        if (event.which === 13) {
            userClicked();
            event.preventDefault();
            return false;
        }
    });
    $("#z").keydown(function (event) {
        if (event.which === 13) {
            userClicked();
            event.preventDefault();
            return false;
        }
    });
    
});
