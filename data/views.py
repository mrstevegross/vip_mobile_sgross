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

######################FORMS##################### (Try to create all forms here)




class ManualVoterForm(forms.ModelForm):
    """
    Initial form seen on the start page
    """
    class Meta:
        model = Voter
        fields = ['address','state']


#########################HELPERS###################################

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




##################################SERVICES (VIEWS)################################



def log(request):
    args = dict(((str(k),str(v)) for k,v in request.POST.iteritems()))
    return HttpResponse(json.dumps(args))

from urllib import urlencode
from urllib2 import urlopen
def echo(request):
    args = urlencode(dict(((str(k).replace('address','q'),str(v)) for k,v in request.GET.iteritems())))
    api_response = urlopen("http://pollinglocation.googleapis.com/?electionid=1766&" + args).read()
    return HttpResponse(api_response, mimetype='application/json')

################################## PAGES (VIEWS) ################################

def start(request):
    """Shows lookup form."""
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
