


        var settings = {
            skip: 1/3,
            like: 30000,
            historySize: 3,
            playlistSize: 40,
            artist: 7
        }
        if ( document.URL.indexOf("fast") > -1 ) {
            settings.skip = 1/100; 
            settings.like = 3000; 
        } 

        var songqueue = new Array(); 
        var currentSong; 
        var currentId = 1; 
        var partyStarted = 0; 
        var recentlyPlayed = new Array(); 
        var currentPlaytime = 0; 
        var lastRequest = null; 
        var Service = {
            search: function ( searchstring ) {

                $.blockUI({ css: { 
                    border: 'none', 
                    padding: '15px', 
                    backgroundColor: '#000', 
                    '-webkit-border-radius': '10px', 
                    '-moz-border-radius': '10px', 
                    opacity: .5, 
                    color: '#fff' 
                }, message :'<img src="../icon/clock.png" /> <span class="bigger">Searching songs..</span> ' });

                $.ajax({
                    url: 'http://ws.spotify.com/search/1/track.json?q=' + searchstring,
                    dataType: 'json',
                    success: function(data) {
       
                        setTimeout($.unblockUI, 500); 
                        var html = '<table class="table table-bordered table-striped"><thead>'
                                +'<tr><th></th><th>Artist</th><th>Song</th><th>Album</th><th>Length</th></tr>'
                                +'</thead><tbody>';

                        var lastRequest = data; 
                        $.each(data.tracks, function(key, track) {
                            if ( track.length < 600 ) {
                                html +=' <tr><td class="adds"><a class="addsong btn btn-primary" data-song="'+track.href+'">add</a></td><td>'+
                                    track.artists[0].name+'</td><td>'+
                                    track.name.substring(0,70 )+'</td><td>'+
                                    track.album.name.substring(0,70 )+'</td><td>'+
                                    showtime( track.length )+'</td></tr>';
                            }                      
                        });
                        html += '</tbody></table>';

                        $("#searchresults").html( html );
                        Service.processSearchResults(); 
                    }
                });
            },
            processSearchResults: function() {
                $(".addsong").click( function() {
                    var spotId = $(this).attr("data-song");
                    var songrow = $(this).parent().parent().children(); 
                    var artist = songrow.eq(1).html(); 
                    var title = songrow.eq(2).html(); 
                    var length = songrow.eq(4).html().split(":"); 
                    var ll = length[0]*60 + length[1]*1 ; 
                    Service.queueSong( [ spotId, artist, title, ll ], 0, $(this) );
                });

                for ( var i = 0; i < songqueue.length; i ++ ) {
                    if ( songqueue[i][0] ) {
                        var ele = $('*[data-song="'+songqueue[i][0]+'"]');
                        if ( ele ) {
                            ele.removeClass("btn-primary").addClass("btn-danger");
                        }
                    }
                }
            },
            likeSong: function( ele ) {
                var songId = ele.parent().attr("id").substring(4); 
                var songIndex = 0; 
                for (var i = 0; i < songqueue.length; i++) {
                    if (songqueue[i][4] == songId ) {
                        songIndex = i; 
                        break; 
                    }
                }
                songqueue[songIndex][5]++; 
                var newPoints = songqueue[songIndex][5]; 
                for (var i = 0; i < songqueue.length; i++) {
                    if (newPoints > songqueue[i][5] ) {
                        var newId = songqueue[i][4]
                        var temp = songqueue[songIndex];
                        songqueue.splice(songIndex,1);
                        songqueue.splice(i,0,temp);
                        var myele = $("#song"+ songId ); 
                        myele.slideUp('slow', function() {
                            $(this).insertBefore( $("#song" + newId)).fadeIn();
                        });
                        myele.children().eq(0).unbind('click').removeClass("label-success").addClass("label-important").css("cursor","default");
                        setTimeout( function() {
                            myele.children().eq(0).click(function() {
                                Service.likeSong( $(this) );
                            }).removeClass("label-important").addClass("label-success").css("cursor","pointer");

                        }, settings.like );
                        break; 
                    }
                }
            },
            queueSong: function( song, silent, button ) {
                var sameArtist = 0; 
                if ( silent == 0) {
                    for ( var i = 0; i < songqueue.length; i ++ ) {
                        if ( songqueue[i][0] == song[0] ) {
                            $("#song"+( songqueue[i][4]) ).remove(); 
                            songqueue.splice(i,1);
                            $.growlUI('Removed song from playlist', '', undefined, undefined, 'orange' );
                            if ( button ) { button.addClass("btn-primary").removeClass("btn-danger"); }
                            return ; 
                        }
                        if ( songqueue[i][1] == song[1] ) {
                            if ( sameArtist++ >= ( settings.artist-1) ){
                                $.growlUI('Too many songs from ' + song[1] , 'Playlist can have only '+settings.artist + ' songs from the same artist', undefined, undefined, 'red' );                            
                                return; 
                            }
                        }

                    }
                }
                if ( songqueue.length > settings.playlistSize ) {
                    $.growlUI('Playlist is full!', 'Please wait until a few songs were played.', undefined, undefined, 'red' );
                    return ;
                }
                if ( button ) { button.removeClass("btn-primary").addClass("btn-danger"); }
                song[4] = currentId ++; 
                song[5] = 1; 
                var newlength = songqueue.push( song );
                var html = $('<div id="song'+song[4]+'" class="song"><span class="label label-success">+1</span><span class="label label-info">'+song[1]+'</span> - '+ song[2]+'</div>');
                $("#songqueue").append( html );
                if ( ! silent ) { html.hide().fadeIn('slow'); }
                html.find("span.label-success").css("cursor","pointer").click( function() {
                    Service.likeSong( $(this) );
                })
                if ( ! partyStarted ) {
                    partyStarted = 1; 
                    Service.playNextSong(); 
                    Service.playtimeCounter(); 
                }
                if ( ! songqueue.length ) {
                    $("#emptyplaylist").show(); 
                    $("#queuecontainer").hide(); 
                } else if ( songqueue.length ==1 ) {
                    $("#emptyplaylist").hide(); 
                    $("#queuecontainer").show(); 
                }
                if ( !silent ) {

                    // serialize songqueue and save in cookie
                    var seri = "";
                    songqueue.map(function(el, index){
                        seri += el.join("}") + "{";
                    });
                    $.cookie('playlist', seri, { expires: 365 });
                    if ( songqueue.length > (settings.playlistSize-5) ) {
                        $.growlUI('Playlist full in '+(settings.playlistSize - songqueue.length +2 )+' songs!', 'Song added: <span>'+song[1]+'</span> - '+song[2], undefined, undefined, 'orange'  ); 
                    } else {
                        $.growlUI('Song added!', '<span>'+song[1]+'</span> - '+song[2] ); 
                    }
                }
            },
            playNextSong: function(  ) {
                var song = songqueue.shift(); 

                if ( currentSong ) {
                    Service.showRecently( currentSong );
                }
                currentSong = song;   

                $("#songqueue").children().eq(0).slideUp('slow', function() {
                    $(this).remove(); 
                    $.growlUI('Now Playing:', '<span>'+song[1]+'</span> - '+song[2] ); 
                });
                var artist = song[1]; 
                var title = song[2]; 
                var length = song[3] * 1000;
                location.href = song[0];
                currentPlaytime = 0; 
                $("#skipSong").fadeOut('slow'); 
                setTimeout( function() {
                    $("#skipSong").fadeIn('slow'); 
                }, length * settings.skip );
                $("#currentTrack").fadeOut('slow', function() {
                    $(this).html( artist + " - " + title ).fadeIn( 'slow' );
                });
                $("#totaltime").html( showtime( length / 1000 ) );
                $("#playtime").html( showtime( currentPlaytime ) );
                $('#nowprogress').stop().width( 0 ); 
                $('#nowprogress').animate({
                    width: '300px'}, {
                    duration:length,
                    specialEasing: {width: 'linear'},
                    complete: function() {
                        Service.playNextSong(); 
                    }
                });
            },
            playtimeCounter: function() {
                currentPlaytime ++;
                $("#playtime").html( showtime( currentPlaytime ) );
                window.setTimeout( Service.playtimeCounter, 1000 );
            },
            showRecently: function( song ) {
                var maxsongs = settings.historySize; 
                if ( !song[1] ) return; 
                if ( !recentlyPlayed.length ) {
                    $("#recentsongs").html(""); 
                }
                recentlyPlayed.unshift( currentSong );
                var html = $( '<div class="song"><span class="label">'+showtime(  song[3] ) +'</span><span class="label label-info">'+song[1]+'</span> - '+song[2]+'</div>' );
                html.hide(); 
                $("#recentsongs").prepend( html );
                html.fadeIn( "slow");

                if ( recentlyPlayed.length > maxsongs ) {
                    recentlyPlayed.pop(); 
                    $("#recentsongs").children().eq(3).fadeOut( "slow", function() {
                        $(this).remove(); 
                    } );
                }
            },
            loadSettings: function () {
            	var st = $.cookie('settings');
            	if (  st ) {
	                var arr = st.split("{"); 
	                arr.map( function( el, index ) {  
	                    var val = el.split("}"); 
	                    if ( val[0] && val[1]) {
	                        settings[val[0]] = val[1];
	                    }
		            }); 
	            }
            },
			saveSettings: function () {
	            var seri = "";
	            for (var prop in settings) {
 					seri += prop + "}" + settings[prop] + '{';
				}
	            $.cookie('settings', seri, { expires: 365 });
            }            
        }
        function showtime(  time ) {
            var min = Math.floor( time / 60 );
            var sec = Math.floor( time % 60 );
            if ( sec < 10 ) { sec = "0"+ sec; }
            return min + ":" + sec; 
        }

