from django.contrib import admin
from models import *

class LogItemInline(admin.StackedInline):
    model = LogItem
    extra = 0
    
    

class VoterAdmin(admin.ModelAdmin):
    inlines = [
        LogItemInline,
    ]
admin.site.register(Voter,VoterAdmin)

