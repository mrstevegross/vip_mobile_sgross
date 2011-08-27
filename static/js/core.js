/* 
 * @author Mat Marquis
 */

var
map,
start = '',
end,
response,
position,
directionsDisplay,

offices            = [],
candidates         = [],
possible_addresses = [],

$map        = $('.map'),
$directions = $('.directions'),
$candidates = $('.candidates'),

vip = function() {
	return {
		supportsGeolocation : function() {
			return !!navigator.geolocation;
		},
		noLocation : function() {
			vip.showAlert("Sorry, we couldn't find your location.", "alert");
		},
		foundLocation : function(position) {
			start = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
			$('.finding').removeClass('finding');
			$map.trigger("getPolls");
		},
		validateAddress: function() {
		  possible_addresses = [];
		  validator = new google.maps.Geocoder();
		  validator.geocode({address:start},geoHandler);
		  
		  function geoHandler(resp,status) {
		    switch (status) {
		      case 'OK':
			var len = resp.length;

			while(len--) {
			  possible_addresses.push(
			    {
			      address: resp[len].formatted_address,
                              partial_match: resp[len].hasOwnProperty('partial_match')
			    }
			  );
			}

			if(possible_addresses.length > 1) {
			  $map.trigger("showAddressDialog");
			} else if(possible_addresses.length==1){
			  start = possible_addresses[0].address;

			  if(possible_addresses[0].partial_match) {
			    vip.showAlert("This address is a partial match. Please make sure the below address your house address.",'alert');
			  }

			  $map.trigger("getPolls");
			} else {
			  vip.showAlert("I couldn't locate your street address: " + start + ". Sorry :(", 'alert');
			}
			break;

		      case 'REQUEST_DENIED':
			vip.showAlert("GOOGLE SAYS NO!",'alert');
			break;

		      case 'INVALID_REQUEST':
			vip.showAlert("Well...that didn't work.",'alert');
			break;

		      case 'ERROR':
		        vip.showAlert("It seems the Google servers are down...",'alert');
			break;

		      case 'UNKNOWN_ERROR':
			vip.showAlert("I have no idea what happened, but it might work if you try, again.",'alert');
			break;

		      case 'ZERO_RESULTS':
			vip.showAlert("I couldn't locate your street address: " + start + ". Sorry :(", 'alert');
			break;

		      case 'OVER_QUERY_LIMIT':
                        vip.showAlert("Sorry...I've gone over my request limit :(");
			break;
		    }
		  }
	    },

        showAddressDialog: function() {
              // get the screen height and width  
	      var winWidth = $(window).width();
	      
	      var message = "<h3>Are any of these your address?</h3><ul>";

	      $.each(possible_addresses, function(i,obj) {
	        message = [message,"<li><input type='radio' name='address-select' id='address-select-",i,"' value='",obj.address,"' />", "<label for='address-select-",i,"'>",obj.address,"</label></li>"].join('');
	      });

	      message = [message,"</ul><input name='address-submit' class='button' type='submit' value='Find Polling' />"];
	      
          var closeAddressDialogCode = "$('.address-chooser').slideUp('fast');";
	      
	      message = [message,"<button type='button' onclick=\"",closeAddressDialogCode,"\">Close List</button>"];
	      
	      possible_addresses = [];
	      // display the message
	      $('.address-chooser form').html(message.join(''));

              // calculate the values for center alignment
	      var dialogTop =  0;  
	      var dialogLeft = (winWidth/2) - ($('.address-chooser').width()/2);

	      $('.address-chooser').css({top: dialogTop, left: dialogLeft, position: 'absolute'}).slideDown('fast');
	    },
	    
	    showAlert : function(message, type) {
	      $('<output />')
		.addClass(type)
		.text(message)
		.prependTo('body')
		.hide()
		.slideDown(300)
		.animate({opacity: 1}, 1500, function() {
			$(this).slideUp(300, function() {
				$(this).remove();
			    });
		    });
	    },
	    getPolls : function() {
    		$.ajax({
	    		url:      '/electioncenter',
	    		dataType: 'json',
	    		data:     'address=' + start,
	    		success: function(data) {
	    		    response = data;
	    		    if(data.status == 'SUCCESS') { // If the API successfully returns a nearby result:
	    			    $map.trigger('setupMap');
	    			    $('.landing').hide();
          				$('.tabcontainer').show();
	        			$('.tabs').show(0, function() { // Show the navigation tabs.
	        				$(document).trigger('mapSize'); // Now that the tabs have been added to the header, set the map size to fit the remaining viewport.
    				    });
	    		    } else if(data.status == 'ADDRESS_UNPARSEABLE') { // If the API returns an invalid address:
	        			vip.showAlert("Sorry, that address could not be found.", "alert");
	    		    } else {
	        			vip.showAlert("Sorry, no polling locations were found near you.", "alert");
	    		    }
	    		},
	    		error: function() { // If the AJAX call fails:
	    		    vip.showAlert("Sorry, an error occurred.", "alert");
	    		}
		    });
	    },
	    
	    // Function: setupMap
	    // Purpose: Sets up the map.
	    setupMap : function() {	
    		$('.directions, .candidates').html(''); // Empty the candidates/direction lists.
			
    		directionsDisplay = new google.maps.DirectionsRenderer();
    		var opt = {
    		    zoom:      7,
    		    mapTypeId: google.maps.MapTypeId.ROADMAP
    		}

            // Parse out the address of the polling location and store in the 'end' variable.
    		$.each(response.locations, function(i, item) { 
    			$.each(item, function(i, c) {
	    			end = [ c.address.line1,
	    			        [ c.address.city, c.address.state].join(', '),
	    			        c.address.zip
	    			      ].join(' ');
	   		    });
	   	    });

            // Create a Map instance and connect it to the directionsDisplay:
    		map = new google.maps.Map($map.get(0), opt);
    		map.setCenter(new google.maps.LatLng(100, 100)); // Add some default location.
    		directionsDisplay.setMap(map);
    		
    		$map.trigger('calcRoute');	    // Now that the map is set up, calculate the route to the nearest polling location.
    		$map.trigger('getCandidates');	// Meanwhile, parse out the elections and candidates from the results.
	    },
	    
	    // Name: calcRoute
	    //
	    // Purpose: Calculates the route.
	    calcRoute : function() {
	    
    		var request = {
	    	    origin:      start, 
	    	    destination: end,
	    	    travelMode:  google.maps.DirectionsTravelMode.DRIVING
	    	};
	    	
    		var directionsService = new google.maps.DirectionsService();
    		
    		directionsService.route(request, function(result, status) {
	    		if (status == google.maps.DirectionsStatus.OK) {
	    		    directionsDisplay.setDirections(result);
	    		}
		    });
			
	    	directionsDisplay.setPanel($directions.get(0));
	    },
	    
	    // Function: getCandidates
	    //
	    // Purpose: ???
	    getCandidates : function() {
    		$.each(response.contests, function(i,item) {
    			$.each(item, function(i, c) {
    				offices[i] = new Array();
	    			var candidates = new Array();
		    		offices[i][0] = c.office || '';
    				$.each(c.ballot.candidate, function(i, a) {						
    					candidates[i] = new Array();
	    				candidates[i]['name']  = a.name;
		    			candidates[i]['email'] = a.email || '';
			    		candidates[i]['url']   = a.candidate_url || '';
				    	candidates[i]['party'] = a.party;						
				    });

    				offices[i][1] = candidates;
			    });
		    });
    		$map.trigger('showCandidates'); 
	    },
	    
	    showCandidates : function() {
		$('<ul />').addClass('elections').appendTo($candidates);
		$.each(offices, function(i, a){	
			$('<li />').appendTo($candidates.find('.elections'));
			$('<h2 />').text(offices[i][0]).prependTo($candidates.find('.elections > li:last'));
			$('<ul />').appendTo($candidates.find('ul.elections > li:last'));
			$.each(offices[i][1], function(i, candidate) {	
				$('<li />').appendTo($candidates.find('ul ul:last'));
				$('<h3 />').appendTo($candidates.find('ul ul li:last'));
					
				if(candidate['email']) {
				    $('<a />')
					.attr('href', 'mailto: ' + candidate['email'])
					.text(candidate['name'])
					.appendTo($candidates.find('ul ul li:last h3'));
				} else {
				    $candidates.find('ul ul li:last h3').text(candidate['name']);
				}
					
				if(candidate['party']) {
				    $('<span />')
					.text(' - ' + candidate['party'])
					.appendTo($candidates.find('ul ul li:last'));
				}
					
				if(candidate['url']) {
				    $('<a />')
					.attr('href', candidate['url'])
					.text(candidate['url'])
					.addClass('email')
					.appendTo($candidates.find('ul ul li:last'));
				}
			    });
		    });
	    },
	    
	    // Sets the map to 100% height, then subtracts the size of the page header. Called on window resize/orientation change.
	    mapSize : function() { 
    		head = $('header.primary').height();
	    	$('.tabcontainer').height('100%');
	    		    	
	    	mapheight = $('.tabcontainer').height();   
    		$('.tabcontainer').height(mapheight - head);

//          Uncomment the following lines to fix the map rendering. sgross 27 Aug 2011   		
//    		$('.map').height('400px');
//    		$('.map').width('400px');
    		
	    },
	    
	    init : function() {			
    		$('html').removeClass('no-js'); // Used to specify styles specific to users with JS on/off. Currently unused.
			
	    	$(document).ajaxStart(function() { // Show loading indicator during AJAX event.
		    	$('<progress />').addClass('loading').prependTo('body').hide().fadeIn(200);
		    }).ajaxComplete(function() { // Hide indicator when AJAX event ends.
			    $('.loading').fadeOut(200, function() { 
				    $(this).remove();
				});
			});

		if(vip.supportsGeolocation()) {
		    $('<a />').attr({
			    href: '#',
				title: 'Click here to find your current location.'
				}).text('Find Me')
			.addClass('button')
			.addClass('findme')
			.appendTo('fieldset').click(function() {
				$('.confirm').fadeIn();
				$('<a />')
				    .attr('href', '#')
				    .addClass('backdrop')
				    .prependTo('body');
				return false;
			    });
		}
	    }
	};
}();

$(document).bind({
	init              : vip.init,			   // Page setup
	mapSize           : vip.mapSize,		   // Make JSON request
	validateAddress   : vip.validateAddress,   // Validate the user's address
    showAddressDialog : vip.showAddressDialog, // Ask the user which address is theirs
	getPolls          : vip.getPolls,		   // Make JSON request
	setupMap          : vip.setupMap,		   // Initialize the map
	calcRoute         : vip.calcRoute,		   // Calculate and display the route to poll
	getCandidates     : vip.getCandidates,	   // Prepare a list of the candidates
	showCandidates    : vip.showCandidates	   // Display a list of the candidates
}).ready(function() {
	$map.trigger('init');
});

$('header form').submit(function(e) {
	start = $('input[name="address"]').val();
	$map.trigger("validateAddress");
	e.preventDefault();
});

$('.address-chooser form').submit(function(e) {
        e.preventDefault();
        if($('input:radio[name=address-select]')) {
	  start = $('input:radio[name=address-select]:checked').val().replace(/#/g,encodeURIComponent('#'));
	  $('.address-chooser').slideUp('fast');
	  $map.trigger('getPolls');
	} else {
          vip.showAlert("Please select your address.",'alert');
	}
});

$('.confirm a.yes').click(function() {
	$('.findme').addClass('finding');
	$('.confirm').fadeOut();
	navigator.geolocation.getCurrentPosition(vip.foundLocation, vip.noLocation); 
	return false;
});

$('.confirm a.no, .backdrop').live('click', function() {
	$('.confirm').fadeOut();
	$('.backdrop').remove();
	return false;
});

$('.tabs li a').click(function() {
	$(this).parent().addClass('current').siblings().removeClass('current');
	ind = $(this).parent().index();
	$('.pages > li').hide();
	$($('.pages > li').get(ind)).show();
	return false;
});

var supportsOrientationChange = "onorientationchange" in window, 
orientationEvent = supportsOrientationChange ? "orientationchange" : "resize"; // Does device support the onorientationchange event? If not, set the event to "resize".

window.addEventListener(orientationEvent, function() { // Resizes the map on orientation change/window resize
	$(document).trigger('mapSize');
}, false);

