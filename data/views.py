# Create your views here.
from django.http import HttpResponse, HttpResponseRedirect
from models import *
from django.shortcuts import render_to_response,get_object_or_404
from django.template import RequestContext
from django.http import HttpResponseNotFound
from django.core.urlresolvers import reverse
from django.core.paginator import Paginator, InvalidPage, EmptyPage
from django.db.models import Q
from datetime import datetime
from django import forms
#try: import json
#except: import simplejson as json

from urllib import urlencode
from urllib2 import urlopen
import pygeocoder

###################### FORMS #####################

class ManualVoterForm(forms.ModelForm):
    """
    Initial form seen on the start page
    """
    class Meta:
        model = Voter
        fields = ['address','state']

######################### HELPERS ###################################

def capture_voter(request):
    """
        Not a view! Grabs the voter_id the when someone links over and stores it in the session dict. 
        Always uses the session dict value after it is created.
    """
    def make_voter(url_args):
        kwargs = dict(url_args.iteritems())
        voter = Voter(**kwargs)
        voter.save()
        voter.log(request)
        return voter
    
    if "voter_id" in request.session:
        voter = Voter.objects.get(id=request.session['voter_id'])
    else:#unknown user
        if request.method == 'GET': 
            url_args = request.GET
        else: 
            url_args = request.POST
        voter = make_voter(url_args)
        request.session['voter_id'] = voter.id
    return voter

################################## SERVICES (VIEWS) ################################

def log(request):
    """
    ???
    
    Parameters:
      request - ???
      
    Returns:
      ???
    """
    args = dict(((str(k),str(v)) for k,v in request.POST.iteritems()))
    return HttpResponse(json.dumps(args))

def cleanup_address(address):
    """
    Transforms the given address into a (better) formed US address specification.
    
    Parameters:
      address - An address (e.g.: "601 main st se apt 502 minneapolis").
                Note: This can also handle an incomplete address, such as "Richmond VA".
      
    Returns:
      A better-formed address (e.g.: "601 Main St. SE Apt 502, Minneapolis, MN 55414")
    """    
    # Extract a lat/long from the address:
    x = pygeocoder.Geocoder.geocode(address)
    latlng = x[0].__dict__['current']['geometry']['location']
    
    # Now convert the lat/long back into a well-formed addressL
    results = pygeocoder.Geocoder.reverse_geocode(latlng['lat'], latlng['lng'])

    # And return it as a string:    
    return str(results)

def echo(request):
    """
    Sends a request for polling place listings based on an address.
    
    Parameters:
      request - An object with a 'GET' attribute that is a dictionary. This dictionary
                should have the key "address" defined, whose value is the address-to-search.
                
    Returns:
      An HttpResponse object for the executed query
    """
    new_dict      = dict(((str(k).replace('address','q'), str(v)) for k,v in request.GET.iteritems()))
    new_dict['q'] = cleanup_address(new_dict['q'])
    args          = urlencode(new_dict)
    
    # And submit the address request to the pollinglocation API:    
    # For full information on the API, see:
    #   http://electioncenter.googlelabs.com/apidoc_v1_1.html
    api_response  = urlopen("http://pollinglocation.googleapis.com/?electionid=1766&" + args).read()
    http_response = HttpResponse(api_response, mimetype='application/json')
    
    return http_response

################################## PAGES (VIEWS) ################################

def start(request):
    """
    Shows lookup form.
    
    Parameters:
      request - ???
      
    Returns:
      ???
    """
    voter = capture_voter(request)
    data = {'address_form':ManualVoterForm()}
    return render_to_response('start.html',data)

def branded(request,state_abbr):
    """Shows lookup form."""
    try:
        voter = capture_voter(request)
        data = {'address_form':ManualVoterForm(), 'state_abbr':state_abbr}
    except:
        raise Http404
        
    return render_to_response('branded.html',data)

def directions(request):
    """Not implemented"""
    voter = capture_voter(request)
    return render_to_response('directions.html',{})

def share(request):
    """Not implemented"""
    voter = capture_voter(request)
    return render_to_response('share.html',{})

def fail(request):
    """Not implemented"""
    voter = capture_voter(request)
    return render_to_response('fail.html',{})

def details(request):
    """Not implemented"""
    voter = capture_voter(request)
    return render_to_response('details.html',{})

