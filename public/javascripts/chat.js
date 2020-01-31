$(document).ready(function() {
  $(window).keydown(function (e) {
    if (e.keyCode == 116) {
      if (!confirm("Refreshing will erase all the messages, are you sure to refresh？")) {
        e.preventDefault();
      }
    }
  });
  var socket = io.connect();
  var from = $.cookie('user');// read the user from cookie and save it as "from"
  var to = 'all';// default all users as receivers
  // emit online into
  socket.emit('online', {user: from});
  socket.on('online', function (data) {
    //system messages
    if (data.user != from) {
      var sys = '<div style="color:#dd6262">System (' + now() + '):' + 'User ' + data.user + ' entered the TreeHole!</div>';
    } else {
      var sys = '<div style="color:#dd6262">System (' + now() + '): You entered into the TreeHole!</div>';
    }
    $("#contents").append(sys + "<br/>");
    //refresh which users are online
    flushUsers(data.users);
    //show who is talking to who
    showSayTo();
  });

  socket.on('say', function (data) {
    // talk to everyone
    if (data.to == 'all') {
      $("#contents").append('<div>' + data.from + '(' + now() + ')to everyone: <br/>' + data.msg + '</div><br />');
    }
    //talk to one person
    if (data.to == from) {
      $("#contents").append('<div style="color:#dd6262" >' + data.from + '(' + now() + ')saying to you: <br/>' + data.msg + '</div><br />');
    }
  });

  socket.on('offline', function (data) {
    //system msgs
    var sys = '<div style="color:#dd6262">System(' + now() + '):' + 'user ' + data.user + ' exited the TreeHole!</div>';
    $("#contents").append(sys + "<br/>");
    //refresh which users are online
    flushUsers(data.users);
    // if the person talking to is suddenly offline
    if (data.user == to) {
      to = "all";
    }
    //show who is talking to who
    showSayTo();
  });

  //server off
  socket.on('disconnect', function() {
    var sys = '<div style="color:#dd6262">System: fail to connect to the server!</div>';
    $("#contents").append(sys + "<br/>");
    $("#list").empty();
  });

  //server back on
  socket.on('reconnect', function() {
    var sys = '<div style="color:#dd6262">System: successfully reconnected!</div>';
    $("#contents").append(sys + "<br/>");
    socket.emit('online', {user: from});
  });

  //refresh which users are online
  function flushUsers(users) {
    $("#list").empty().append('<li title="doubleClick" alt="all" class="sayingto" onselectstart="return false">everyone</li>');
    
    for (var i in users) {
      $("#list").append('<li alt="' + users[i] + '" title="doubleClick" onselectstart="return false">' + users[i] + '</li>');
    }
    // double click to talk to one person
    $("#list > li").dblclick(function() {
      // can only talk to others so cannot click self, which is from
      if ($(this).attr('alt') != from) {
        //change the double clicked user as talking "to"
        to = $(this).attr('alt');
        
        $("#list > li").removeClass('sayingto');
        
        $(this).addClass('sayingto');
        //refresh who is talking to who
        showSayTo();
      }
    });
  }

  //show to is talking
  function showSayTo() {
    $("#from").html(from);
    $("#to").html(to == "all" ? "everyone" : to);
  }

  //get the current time
  function now() {
    var date = new Date();
    var time = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? ('0' + date.getMinutes()) : date.getMinutes()) + ":" + (date.getSeconds() < 10 ? ('0' + date.getSeconds()) : date.getSeconds());
    return time;
  }

  // say something
  $("#say").click(function() {
    //get the message to be sent
    var $msg = $("#input_content").html();
    if ($msg == "") return;
    //add the message being sent to DOM
    if (to == "all") {
      $("#contents").append('<div> You(' + now() + ')to everyone: <br/>' + $msg + '</div><br />');
    } else {
      $("#contents").append('<div style="color:#dd6262" > you(' + now() + ')to ' + to + ' saying: <br/>' + $msg + '</div><br />');
    }
    // emit message into
    socket.emit('say', {from: from, to: to, msg: $msg});
    // clear chat platform
    $("#input_content").html("").focus();
  });
});
