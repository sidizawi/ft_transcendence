from django.db import models

# Create your models here.
class Message(models.Model):
	sender = models.TextField()
	content = models.TextField()
	timeval = models.TextField()