from django.db import models

# Create your models here.


STATE_CHOICES = (   ('AL','ALABAMA'),
                    ('AK','ALASKA'),
                    ('AZ','ARIZONA'),
                    ('AR','ARKANSAS'),
                    ('CA','CALIFORNIA'),
                    ('CO','COLORADO'),
                    ('CT','CONNECTICUT'),
                    ('DE','DELAWARE'),
                    ('DC','DISTRICT OF COLUMBIA'),
                    ('FL','FLORIDA'),
                    ('GA','GEORGIA'),
                    ('GU','GUAM'),
                    ('HI','HAWAII'),
                    ('ID','IDAHO'),
                    ('IL','ILLINOIS'),
                    ('IN','INDIANA'),
                    ('IA','IOWA'),
                    ('KS','KANSAS'),
                    ('KY','KENTUCKY'),
                    ('LA','LOUISIANA'),
                    ('ME','MAINE'),
                    ('MD','MARYLAND'),
                    ('MA','MASSACHUSETTS'),
                    ('MI','MICHIGAN'),
                    ('MN','MINNESOTA'),
                    ('MS','MISSISSIPPI'),
                    ('MO','MISSOURI'),
                    ('MT','MONTANA'),
                    ('NE','NEBRASKA'),
                    ('NV','NEVADA'),
                    ('NH','NEW HAMPSHIRE'),
                    ('NJ','NEW JERSEY'),
                    ('NM','NEW MEXICO'),
                    ('NY','NEW YORK'),
                    ('NC','NORTH CAROLINA'),
                    ('ND','NORTH DAKOTA'),
                    ('OH','OHIO'),
                    ('OK','OKLAHOMA'),
                    ('OR','OREGON'),
                    ('PA','PENNSYLVANIA'),
                    ('PR','PUERTO RICO'),
                    ('RI','RHODE ISLAND'),
                    ('SC','SOUTH CAROLINA'),
                    ('SD','SOUTH DAKOTA'),
                    ('TN','TENNESSEE'),
                    ('TX','TEXAS'),
                    ('UT','UTAH'),
                    ('VT','VERMONT'),
                    ('VA','VIRGINIA'),
                    ('WA','WASHINGTON'),
                    ('WV','WEST VIRGINIA'),
                    ('WI','WISCONSIN'),
                    ('WY','WYOMING'),
  ) 


class Voter(models.Model):
    """
    A model for storing information about voters. Nothing here is essential. 
    The idea is to add information as it is encountered. Voter id's are stored in the session.
    """
    email            = models.EmailField   (null=True, blank=True)
    address          = models.CharField    (max_length=200,null=True, blank=True)
    state            = models.CharField    (choices=STATE_CHOICES,max_length=2,null=True, blank=True)
    zip              = models.CharField    (max_length=11,null=True, blank=True)
    created          = models.DateTimeField(auto_now=True,null=True, blank=True)
    is_mobile        = models.BooleanField (default=False)
    reverse_geocoded = models.BooleanField (default=False)
    x_coord          = models.CharField    (max_length=50,null=True, blank=True)
    y_coord          = models.CharField    (max_length=50,null=True, blank=True)
    has_fb           = models.BooleanField (default=False)
    fb_name          = models.CharField    (max_length=70,null=True, blank=True)
    fb_token         = models.CharField    (max_length=500,null=True, blank=True)
    
    def log(self,request):
        """
        Creates a new log item.
        """
        logged = LogItem(voter=self,topic="request",data=str(request))
        logged.save()

    
    
class LogItem(models.Model):
    """
    Store whatever here. This model is not optimized for retrieving information.
    """
    voter = models.ForeignKey(Voter)
    topic = models.CharField(max_length=20)
    data = models.TextField()
    created = models.DateTimeField(auto_now=True)
    
