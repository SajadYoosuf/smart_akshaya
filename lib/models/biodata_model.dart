import 'dart:convert';

class BiodataModel {
  String id;
  String applicantName;
  String mobileNumber;
  String emailId;
  String profession;
  String address;
  String photoPath; // Local path or base64
  
  // Basic Details
  String fatherName;
  String gender;
  String dateOfBirth;
  String maritalStatus;
  String nationality;
  String religion;
  String passportNumber;

  List<LanguageItem> languages;
  List<ExperienceItem> experiences;
  List<EducationItem> educations;
  List<ProjectItem> projects;
  List<String> skills;

  BiodataModel({
    required this.id,
    this.applicantName = '',
    this.mobileNumber = '',
    this.emailId = '',
    this.profession = '',
    this.address = '',
    this.photoPath = '',
    this.fatherName = '',
    this.gender = 'Male',
    this.dateOfBirth = '',
    this.maritalStatus = 'Single',
    this.nationality = '',
    this.religion = '',
    this.passportNumber = '',
    this.languages = const [],
    this.experiences = const [],
    this.educations = const [],
    this.projects = const [],
    this.skills = const [],
  });

  factory BiodataModel.empty() {
    return BiodataModel(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      languages: [],
      experiences: [],
      educations: [],
      projects: [],
      skills: [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'applicantName': applicantName,
      'mobileNumber': mobileNumber,
      'emailId': emailId,
      'profession': profession,
      'address': address,
      'photoPath': photoPath,
      'fatherName': fatherName,
      'gender': gender,
      'dateOfBirth': dateOfBirth,
      'maritalStatus': maritalStatus,
      'nationality': nationality,
      'religion': religion,
      'passportNumber': passportNumber,
      'languages': languages.map((x) => x.toJson()).toList(),
      'experiences': experiences.map((x) => x.toJson()).toList(),
      'educations': educations.map((x) => x.toJson()).toList(),
      'projects': projects.map((x) => x.toJson()).toList(),
      'skills': skills,
    };
  }

  factory BiodataModel.fromJson(Map<String, dynamic> json) {
    return BiodataModel(
      id: json['id'] ?? '',
      applicantName: json['applicantName'] ?? '',
      mobileNumber: json['mobileNumber'] ?? '',
      emailId: json['emailId'] ?? '',
      profession: json['profession'] ?? '',
      address: json['address'] ?? '',
      photoPath: json['photoPath'] ?? '',
      fatherName: json['fatherName'] ?? '',
      gender: json['gender'] ?? 'Male',
      dateOfBirth: json['dateOfBirth'] ?? '',
      maritalStatus: json['maritalStatus'] ?? 'Single',
      nationality: json['nationality'] ?? '',
      religion: json['religion'] ?? '',
      passportNumber: json['passportNumber'] ?? '',
      languages: json['languages'] != null ? List<LanguageItem>.from(json['languages'].map((x) => LanguageItem.fromJson(x))) : [],
      experiences: json['experiences'] != null ? List<ExperienceItem>.from(json['experiences'].map((x) => ExperienceItem.fromJson(x))) : [],
      educations: json['educations'] != null ? List<EducationItem>.from(json['educations'].map((x) => EducationItem.fromJson(x))) : [],
      projects: json['projects'] != null ? List<ProjectItem>.from(json['projects'].map((x) => ProjectItem.fromJson(x))) : [],
      skills: json['skills'] != null ? List<String>.from(json['skills']) : [],
    );
  }
}

class LanguageItem {
  String language;
  String level;
  LanguageItem({this.language = '', this.level = 'Beginner'});
  Map<String, dynamic> toJson() => {'language': language, 'level': level};
  factory LanguageItem.fromJson(Map<String, dynamic> json) => LanguageItem(language: json['language'] ?? '', level: json['level'] ?? 'Beginner');
}

class ExperienceItem {
  String experience;
  String duration;
  ExperienceItem({this.experience = '', this.duration = ''});
  Map<String, dynamic> toJson() => {'experience': experience, 'duration': duration};
  factory ExperienceItem.fromJson(Map<String, dynamic> json) => ExperienceItem(experience: json['experience'] ?? '', duration: json['duration'] ?? '');
}

class EducationItem {
  String degree;
  String institution;
  String year;
  EducationItem({this.degree = '', this.institution = '', this.year = ''});
  Map<String, dynamic> toJson() => {'degree': degree, 'institution': institution, 'year': year};
  factory EducationItem.fromJson(Map<String, dynamic> json) => EducationItem(degree: json['degree'] ?? '', institution: json['institution'] ?? '', year: json['year'] ?? '');
}

class ProjectItem {
  String projectName;
  String description;
  ProjectItem({this.projectName = '', this.description = ''});
  Map<String, dynamic> toJson() => {'projectName': projectName, 'description': description};
  factory ProjectItem.fromJson(Map<String, dynamic> json) => ProjectItem(projectName: json['projectName'] ?? '', description: json['description'] ?? '');
}
