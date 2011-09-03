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

// Represents the list of found contests.
// Each item in the list is a 2-item list, where:
//   The first item is the name of the office;
//   The second item is a list of candidates for that office.
//     Each item in that list is a hash table with keys:
//      name - Name of candidate
//      email - Email address of candidate
//      url   - URL for candidates' website
//      party - Party affiliation of candidate
//
//  e.g.:
//  [ 'Commissioner of Insurance',
//    [ { name: 'Steve', email: 'sgross@gmail.com', url: 'http://cnn.com'; party: 'dnc'   }, 
//      { name: 'Bob',   email: 'bob@gmail.com',    url: 'http://cnn.com'; party: 'repub' }
//    ]
//  ] 
//
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
            validator          = new google.maps.Geocoder();

            validator.geocode({ address: start }, handle_lookup_by_address);
            
            function handle_invalid_status(status) {
                switch (status) {
                    case 'INVALID_REQUEST':  vip.showAlert("Well...that didn't work.",'alert');                                           break;
                    case 'ERROR':            vip.showAlert("It seems the Google servers are down...",'alert');                            break;
                    case 'UNKNOWN_ERROR':    vip.showAlert("I have no idea what happened, but it might work if you try, again.",'alert'); break;
                    case 'ZERO_RESULTS':     vip.showAlert("I couldn't locate your street address: " + start + ". Sorry :(", 'alert');    break;
                    case 'OVER_QUERY_LIMIT': vip.showAlert("Sorry...I've gone over my request limit :(");                                 break;
                }
            };

            function handle_lookup_by_address(resp, status) {
                if(status == 'OK') {

                    // Assemble list of possible addresses:
                    for(var i = 0; i < resp.length; i++) {
                        var addr = resp[i].address_components.map(function(item) { return item.long_name } ).join(' ');
                        possible_addresses.push({ address: addr, partial_match: resp[i].hasOwnProperty('partial_match') });
                    }

                    // If there was only 1, try reverse-geocoding to get a better expression of the address:                        
                    if(resp.length == 1) {
                        validator.geocode({ location: resp[0].geometry.location }, handle_lookup_by_location);
                    }
                    else {
                        handle_possible_addresses();
                    }
                }
                else {
                    handle_invalid_status(status);
                }
            };
            
            function handle_lookup_by_location(resp, status) {
                if(status == 'OK') {

                    // Google might have returned an address range; if so, pick the average street address from the range:                
                    var addr_range_pat = /^(\d+)-(\d+)$/;
                    var match          = addr_range_pat.exec(resp[0].address_components[0].long_name);
                    
                    if(match) {
                        var min = parseInt(match[1]);
                        var max = parseInt(match[2]);
                        var avg = Math.round((min + max) / 2.0);
                      
                        resp[0].address_components[0].long_name = avg;
                    }
                
                    var geocoded_address = resp[0].address_components.map(function(item) { return item.long_name } ).join(' ');
                    possible_addresses.push({ address: geocoded_address });
                    handle_possible_addresses();
                }
                else {
                    handle_invalid_status(status);
                }
                
            };
		  
            function handle_possible_addresses() {
	            if(possible_addresses.length > 1) {
                    $map.trigger("showAddressDialog");
	    		}
	    		else if(possible_addresses.length == 1) {
                    start = possible_addresses[0].address;

                    if(possible_addresses[0].partial_match) {
        			    vip.showAlert("This address is a partial match. Please make sure the below address your house address.", 'alert');
                    }

                    $map.trigger("getPolls");
    			}
    			else {
                    vip.showAlert("I couldn't locate your street address: " + start + ". Sorry :(", 'alert');
                }
            };
	    },

        // Name: showAddressDialog
        //
        // Purpose: Display the address-chooser dialog.
        //
        //
        showAddressDialog: function() {
              // get the screen height and width  
	      var winWidth = $(window).width();
	      
	      var message = "<h3>Are any of these your address?</h3><ul>";

	      $.each(possible_addresses, function(i, obj) {
	        message = [ message,
	                    "<li><input type='radio' name='address-select' id='address-select-",
	                    i,
	                    "' value='",
	                    obj.address,
	                    "' />", 
	                    "<label for='address-select-",
	                    i,
	                    "'>",
	                    obj.address,
	                    "</label></li>" ].join('');
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
	    
	    // Name: getPolls
	    //
	    // Purpose: Submit a request for polling locations and up the UI with the results.
	    //
	    // Implementation note: The ajax request is processed by data/views.py:echo().
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
	    //
	    // Purpose: Sets up the map.
	    //
	    // Parameters: None
	    //
	    // Returns: None
	    //
	    setupMap : function() {	
    		$('.directions, .candidates').html(''); // Empty the candidates/direction lists.
			
    		directionsDisplay = new google.maps.DirectionsRenderer();
    		var opt = { zoom: 7, mapTypeId: google.maps.MapTypeId.ROADMAP }
    		var locationName = "Unnamed Location";

            // Clean up the start text given the response data:
            start = response.normalized_input.line1 + ", "
                  + response.normalized_input.city  + ", "
                  + response.normalized_input.state + " "
                  + response.normalized_input.zip

            // Parse out the address of the polling location and store in the 'end' variable.
            // Note: We're just using the first address returned for now.
            var address = response.locations[0].address

		    if(address.location_name != '') {
    	        locationName = address.location_name;
		    }
    			    
   			end = [ address.line1,
   			        [ address.city, address.state].join(', '),
   			        address.zip
   			      ].join(' ');

            // Create a Map instance and connect it to the directionsDisplay:
    		map = new google.maps.Map($map.get(0), opt);
    		directionsDisplay.setMap(map);
    		
    		$map.trigger('calcRoute', [ locationName ]); // Now that the map is set up, calculate the route to the nearest polling location.
    		$map.trigger('getCandidates');	             // Meanwhile, parse out the elections and candidates from the results.
	    },
	    
	    // Name: calcRoute
	    //
	    // Purpose: Calculates and renders the route.
	    //
	    // Parameters:
	    //   event        - Event instance (ignored)
	    //   locationName - Name of location
	    //
	    // Returns:
	    //   Nothing
	    calcRoute : function(event, locationName) {
	    
            // Put together options for the request:
    		var request = {
	    	    origin:      start, 
	    	    destination: end,
	    	    travelMode:  google.maps.DirectionsTravelMode.DRIVING
	    	};

            // Submit the request:	    	
    		var directionsService = new google.maps.DirectionsService();
    		
    		directionsService.route(request, function(result, status) {

    		    // ON success, set the directions:
	    		if (status == google.maps.DirectionsStatus.OK) {
	    		
                    // Prepend the location name:
                    var legCount = result.routes[0].legs.length
  	                result.routes[0].legs[legCount - 1].end_address =
       	                  locationName + " " + result.routes[0].legs[legCount - 1].end_address;
       	            
                    // And set the directions:   	                
	    		    directionsDisplay.setDirections(result);
	    		}
		    });
			
	    	directionsDisplay.setPanel($directions.get(0));
	    },
	    
	    // Function: getCandidates
	    //
	    // Purpose: Process the contests portion of the election API response.
	    //
   	    //    "contests": [
        //    {
        //      "dataset_id": 1869,
        //      "election_id": 1766,
        //      "id": "1869:7004503294244",
        //      "type": "General",
        //      "partisan": "no",
        //      "office": "Commissioner of Insurance",
        //      "ballot": {
        //        "candidate": [
        //          {
        //            "id": 900619,
        //            "name": "Sandy Praeger",
        //            "party": "Republican",
        //            "filed_mailing_address": {
        //              "line1": "",
        //              "line2": "",
        //              "line3": "",
        //              "city": "",
        //              "state": "KS",
        //              "zip": ""
        //            }
        //          }
        //        ]
        //      }
        //    },

	    getCandidates : function() {
	    
	        // For each contest:
    		$.each(response.contests, function(i, c) {
    		
				offices[i] = new Array();
    			var candidates = new Array();
	    		offices[i][0] = c.office || 'Unnamed Office';
				$.each(c.ballot.candidate, function(i, a) {						
				
					candidates[i] = new Array();
    				candidates[i]['name']  = a.name;
	    			candidates[i]['email'] = a.email || '';
		    		candidates[i]['url']   = a.candidate_url || '';
			    	candidates[i]['party'] = a.party;						
			    });

				offices[i][1] = candidates;
		    });
		    
    		$map.trigger('showCandidates'); 
	    },
	    
	    // Name: showCandidates
	    //
	    // Purpose: Render the candidates information as HTML.
        //  [ 'Commissioner of Insurance',
        //    [ { name: 'Steve', email: 'sgross@gmail.com', url: 'http://cnn.com'; party: 'dnc'   }, 
        //      { name: 'Bob',   email: 'bob@gmail.com',    url: 'http://cnn.com'; party: 'repub' }
        //    ]
        //  ]    
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
       	    $('.map').height('400px');
    	    $('.map').width('400px');
    		
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

// Define how a submit action will be handled.
$('.address-chooser form').submit(function(e) {

    e.preventDefault();
    
    if($('input:radio[name=address-select]')) {
        start = $('input:radio[name=address-select]:checked').val().replace(/#/g,encodeURIComponent('#'));
        
        // Make the address chooser slide away:
	    $('.address-chooser').slideUp('fast');
	    
	    // Get the poll locations:
	    $map.trigger('getPolls');
	}
	else {
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

