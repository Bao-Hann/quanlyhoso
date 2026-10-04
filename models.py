from django.contrib.auth.models import User
from django.db import models


class ScientistProfile(models.Model):
    GENDER_CHOICES = [(0, "Nữ"), (1, "Nam")]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="scientist_profile")
    full_name = models.CharField(max_length=180, blank=True)
    gender = models.IntegerField(choices=GENDER_CHOICES, default=0)
    dob = models.DateField(null=True, blank=True)
    pob = models.CharField(max_length=255, blank=True)
    hometown = models.CharField(max_length=255, blank=True)
    ethnicity = models.CharField(max_length=100, blank=True)
    position = models.CharField(max_length=255, blank=True)
    work_unit = models.CharField(max_length=255, blank=True)
    address = models.CharField(max_length=500, blank=True)
    office_phone = models.CharField(max_length=40, blank=True)
    home_phone = models.CharField(max_length=40, blank=True)
    mobile_phone = models.CharField(max_length=40, blank=True)
    fax = models.CharField(max_length=60, blank=True)
    email = models.EmailField(blank=True)
    citizen_id = models.CharField(max_length=30, blank=True)
    date_issue = models.DateField(null=True, blank=True)
    place_issue = models.CharField(max_length=255, blank=True)
    accept_teaching = models.BooleanField(default=False)
    accept_researching = models.BooleanField(default=False)
    accept_committee = models.BooleanField(default=False)
    accept_instructor = models.BooleanField(default=False)

    def __str__(self):
        return self.full_name or self.user.username


class TeachingSubject(models.Model):
    profile = models.ForeignKey(ScientistProfile, on_delete=models.CASCADE, related_name="teaching_subjects")
    major = models.CharField(max_length=255, blank=True)
    subject = models.CharField(max_length=255)
    description = models.TextField(blank=True)


class ResearchDirection(models.Model):
    profile = models.ForeignKey(ScientistProfile, on_delete=models.CASCADE, related_name="research_directions")
    major = models.CharField(max_length=255, blank=True)
    direction = models.CharField(max_length=255)
    description = models.TextField(blank=True)


class AcademicCredential(models.Model):
    KIND_CHOICES = [("degree", "Học vị"), ("title", "Học hàm")]
    profile = models.ForeignKey(ScientistProfile, on_delete=models.CASCADE, related_name="credentials")
    kind = models.CharField(max_length=20, choices=KIND_CHOICES, default="degree")
    level = models.CharField(max_length=120)
    major = models.CharField(max_length=255, blank=True)
    institution = models.CharField(max_length=255, blank=True)
    year = models.PositiveIntegerField(null=True, blank=True)
    training_system = models.CharField(max_length=120, blank=True)
    country = models.CharField(max_length=120, blank=True)
    thesis = models.CharField(max_length=500, blank=True)


class LanguageSkill(models.Model):
    profile = models.ForeignKey(ScientistProfile, on_delete=models.CASCADE, related_name="languages")
    name = models.CharField(max_length=100)
    proficiency = models.CharField(max_length=150, blank=True)
    certificate = models.CharField(max_length=255, blank=True)


class WorkExperience(models.Model):
    profile = models.ForeignKey(ScientistProfile, on_delete=models.CASCADE, related_name="work_experiences")
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    current = models.BooleanField(default=False)
    institution = models.CharField(max_length=255)
    position = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)


class ResearchProject(models.Model):
    profile = models.ForeignKey(ScientistProfile, on_delete=models.CASCADE, related_name="projects")
    title = models.CharField(max_length=500)
    start_year = models.PositiveIntegerField(null=True, blank=True)
    end_year = models.PositiveIntegerField(null=True, blank=True)
    level = models.CharField(max_length=160, blank=True)
    ranking = models.CharField(max_length=160, blank=True)
    position = models.CharField(max_length=255, blank=True)
    budget = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    budget_currency = models.CharField(max_length=10, default="VND")


class Publication(models.Model):
    TYPE_CHOICES = [("article", "Bài báo khoa học"), ("seminar", "Seminar - Hội thảo"), ("textbook", "Sách giáo trình")]
    profile = models.ForeignKey(ScientistProfile, on_delete=models.CASCADE, related_name="publications")
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default="article")
    title = models.CharField(max_length=700)
    location = models.CharField(max_length=255, blank=True)
    year = models.PositiveIntegerField(null=True, blank=True)
    month = models.PositiveSmallIntegerField(null=True, blank=True)
    journal = models.CharField(max_length=255, blank=True)
    doi = models.CharField(max_length=255, blank=True)
    url = models.URLField(blank=True)
    description = models.TextField(blank=True)


class Award(models.Model):
    CATEGORY_CHOICES = [("science_award", "Giải thưởng Khoa học và Công nghệ"), ("tech_transfer", "Chuyển giao công nghệ")]
    profile = models.ForeignKey(ScientistProfile, on_delete=models.CASCADE, related_name="awards")
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default="science_award")
    name = models.CharField(max_length=500)
    organization = models.CharField(max_length=255, blank=True)
    year = models.PositiveIntegerField(null=True, blank=True)
    description = models.TextField(blank=True)
