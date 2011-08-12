from django.conf.urls.defaults import *

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('tools.data.views',
    (r'^$', 'start'),
    (r'^data/', 'log'),
    (r'^branded/(?P<state_abbr>\w+)/', 'branded'),
    (r'^electioncenter', 'echo'),
)

urlpatterns += patterns('',
    (r'^admin/', include(admin.site.urls)),
)

try:

    from django.conf import settings
    
    if settings.DEBUG:
        urlpatterns += patterns('',
            (r'^static/(?P<path>.*)$', 'django.views.static.serve',
                    {'document_root': settings.MEDIA_ROOT}),
            )
        urlpatterns += patterns('',
            (r'^media/(?P<path>.*)$', 'django.views.static.serve',
                    {'document_root': settings.MEDIA_ROOT}),
            )
except:
    pass
