import 'dart:io';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import '../../../models/biodata_model.dart';

class BiodataFormPanel extends StatefulWidget {
  final BiodataModel biodata;
  final VoidCallback onChanged;

  const BiodataFormPanel({
    super.key,
    required this.biodata,
    required this.onChanged,
  });

  @override
  State<BiodataFormPanel> createState() => _BiodataFormPanelState();
}

class _BiodataFormPanelState extends State<BiodataFormPanel> {
  final List<bool> _expandedStates = [true, false, false, false, false, false, false];

  void _notifyChange() {
    widget.onChanged();
  }

  Future<void> _pickPhoto() async {
    final result = await FilePicker.platform.pickFiles(type: FileType.image);
    if (result != null && result.files.single.path != null) {
      setState(() {
        widget.biodata.photoPath = result.files.single.path!;
        _notifyChange();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: ExpansionPanelList(
        elevation: 1,
        expandedHeaderPadding: const EdgeInsets.all(0),
        expansionCallback: (int index, bool isExpanded) {
          setState(() {
            _expandedStates[index] = !isExpanded; // flutter < 3.24 logic or standard
            // Or if newer flutter, it provides isExpanded directly. 
            // In typical ExpansionPanelList, we just toggle.
          });
        },
        children: [
          _buildPersonalDetailsPanel(),
          _buildBasicDetailsPanel(),
          _buildLanguagesPanel(),
          _buildExperiencePanel(),
          _buildEducationPanel(),
          _buildProjectsPanel(),
          _buildSkillsPanel(),
        ],
      ),
    );
  }

  ExpansionPanel _buildPersonalDetailsPanel() {
    return ExpansionPanel(
      headerBuilder: (context, isExpanded) => const ListTile(title: Text('Personal Details', style: TextStyle(fontWeight: FontWeight.bold))),
      isExpanded: _expandedStates[0],
      canTapOnHeader: true,
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Row(
              children: [
                Expanded(child: _buildTextField('Applicant Name *', widget.biodata.applicantName, (v) => widget.biodata.applicantName = v)),
                const SizedBox(width: 16),
                Expanded(child: _buildTextField('Mobile Number *', widget.biodata.mobileNumber, (v) => widget.biodata.mobileNumber = v)),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(child: _buildTextField('E-mail id *', widget.biodata.emailId, (v) => widget.biodata.emailId = v)),
                const SizedBox(width: 16),
                Expanded(child: _buildTextField('Profession (optional)', widget.biodata.profession, (v) => widget.biodata.profession = v)),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  flex: 2,
                  child: _buildTextField('Address *', widget.biodata.address, (v) => widget.biodata.address = v, maxLines: 4),
                ),
                const SizedBox(width: 16),
                Expanded(
                  flex: 1,
                  child: Column(
                    children: [
                      InkWell(
                        onTap: _pickPhoto,
                        child: Container(
                          height: 120,
                          width: 100,
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.grey.shade300),
                            borderRadius: BorderRadius.circular(8),
                            color: Colors.grey.shade100,
                          ),
                          child: widget.biodata.photoPath.isNotEmpty && File(widget.biodata.photoPath).existsSync()
                              ? ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: Image.file(File(widget.biodata.photoPath), fit: BoxFit.cover),
                                )
                              : const Icon(Icons.add_a_photo, color: Colors.grey),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            )
          ],
        ),
      ),
    );
  }

  ExpansionPanel _buildBasicDetailsPanel() {
    return ExpansionPanel(
      headerBuilder: (context, isExpanded) => const ListTile(title: Text('Basic Details', style: TextStyle(fontWeight: FontWeight.bold))),
      isExpanded: _expandedStates[1],
      canTapOnHeader: true,
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Row(
              children: [
                Expanded(child: _buildTextField('Father\'s Name', widget.biodata.fatherName, (v) => widget.biodata.fatherName = v)),
                const SizedBox(width: 16),
                Expanded(child: _buildDropdown('Gender', ['Male', 'Female', 'Other'], widget.biodata.gender, (v) => widget.biodata.gender = v!)),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(child: _buildTextField('Date of Birth', widget.biodata.dateOfBirth, (v) => widget.biodata.dateOfBirth = v)),
                const SizedBox(width: 16),
                Expanded(child: _buildDropdown('Marital Status', ['Single', 'Married'], widget.biodata.maritalStatus, (v) => widget.biodata.maritalStatus = v!)),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(child: _buildTextField('Nationality', widget.biodata.nationality, (v) => widget.biodata.nationality = v)),
                const SizedBox(width: 16),
                Expanded(child: _buildTextField('Religion', widget.biodata.religion, (v) => widget.biodata.religion = v)),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(child: _buildTextField('Passport Number', widget.biodata.passportNumber, (v) => widget.biodata.passportNumber = v)),
                const SizedBox(width: 16),
                Expanded(child: Container()), // Empty space
              ],
            )
          ],
        ),
      ),
    );
  }

  ExpansionPanel _buildLanguagesPanel() {
    return ExpansionPanel(
      headerBuilder: (context, isExpanded) => const ListTile(title: Text('Languages Known', style: TextStyle(fontWeight: FontWeight.bold))),
      isExpanded: _expandedStates[2],
      canTapOnHeader: true,
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            ...widget.biodata.languages.asMap().entries.map((entry) {
              int idx = entry.key;
              var lang = entry.value;
              return Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: Row(
                  children: [
                    Expanded(child: _buildTextField('Language', lang.language, (v) => lang.language = v)),
                    const SizedBox(width: 16),
                    Expanded(child: _buildDropdown('Level', ['Beginner', 'Intermediate', 'Expert'], lang.level, (v) => lang.level = v!)),
                    IconButton(icon: const Icon(Icons.remove_circle, color: Colors.red), onPressed: () {
                      setState(() { widget.biodata.languages.removeAt(idx); _notifyChange(); });
                    }),
                  ],
                ),
              );
            }).toList(),
            TextButton.icon(
              onPressed: () {
                setState(() { widget.biodata.languages.add(LanguageItem()); _notifyChange(); });
              },
              icon: const Icon(Icons.add_circle, color: Colors.green),
              label: const Text('Add Language'),
            )
          ],
        ),
      ),
    );
  }

  ExpansionPanel _buildExperiencePanel() {
    return ExpansionPanel(
      headerBuilder: (context, isExpanded) => const ListTile(title: Text('Experiences', style: TextStyle(fontWeight: FontWeight.bold))),
      isExpanded: _expandedStates[3],
      canTapOnHeader: true,
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            ...widget.biodata.experiences.asMap().entries.map((entry) {
              int idx = entry.key;
              var exp = entry.value;
              return Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: Row(
                  children: [
                    Expanded(flex: 2, child: _buildTextField('Experience/Role', exp.experience, (v) => exp.experience = v)),
                    const SizedBox(width: 16),
                    Expanded(flex: 1, child: _buildTextField('Duration (e.g. 2012-2015)', exp.duration, (v) => exp.duration = v)),
                    IconButton(icon: const Icon(Icons.remove_circle, color: Colors.red), onPressed: () {
                      setState(() { widget.biodata.experiences.removeAt(idx); _notifyChange(); });
                    }),
                  ],
                ),
              );
            }).toList(),
            TextButton.icon(
              onPressed: () {
                setState(() { widget.biodata.experiences.add(ExperienceItem()); _notifyChange(); });
              },
              icon: const Icon(Icons.add_circle, color: Colors.green),
              label: const Text('Add Experience'),
            )
          ],
        ),
      ),
    );
  }

  ExpansionPanel _buildEducationPanel() {
    return ExpansionPanel(
      headerBuilder: (context, isExpanded) => const ListTile(title: Text('Education Details', style: TextStyle(fontWeight: FontWeight.bold))),
      isExpanded: _expandedStates[4],
      canTapOnHeader: true,
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            ...widget.biodata.educations.asMap().entries.map((entry) {
              int idx = entry.key;
              var edu = entry.value;
              return Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: Row(
                  children: [
                    Expanded(child: _buildTextField('Degree/Course', edu.degree, (v) => edu.degree = v)),
                    const SizedBox(width: 8),
                    Expanded(child: _buildTextField('Institution', edu.institution, (v) => edu.institution = v)),
                    const SizedBox(width: 8),
                    Expanded(child: _buildTextField('Year', edu.year, (v) => edu.year = v)),
                    IconButton(icon: const Icon(Icons.remove_circle, color: Colors.red), onPressed: () {
                      setState(() { widget.biodata.educations.removeAt(idx); _notifyChange(); });
                    }),
                  ],
                ),
              );
            }).toList(),
            TextButton.icon(
              onPressed: () {
                setState(() { widget.biodata.educations.add(EducationItem()); _notifyChange(); });
              },
              icon: const Icon(Icons.add_circle, color: Colors.green),
              label: const Text('Add Education'),
            )
          ],
        ),
      ),
    );
  }

  ExpansionPanel _buildProjectsPanel() {
    return ExpansionPanel(
      headerBuilder: (context, isExpanded) => const ListTile(title: Text('Projects Details', style: TextStyle(fontWeight: FontWeight.bold))),
      isExpanded: _expandedStates[5],
      canTapOnHeader: true,
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            ...widget.biodata.projects.asMap().entries.map((entry) {
              int idx = entry.key;
              var proj = entry.value;
              return Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: Row(
                  children: [
                    Expanded(child: _buildTextField('Project Name', proj.projectName, (v) => proj.projectName = v)),
                    const SizedBox(width: 8),
                    Expanded(flex: 2, child: _buildTextField('Description', proj.description, (v) => proj.description = v)),
                    IconButton(icon: const Icon(Icons.remove_circle, color: Colors.red), onPressed: () {
                      setState(() { widget.biodata.projects.removeAt(idx); _notifyChange(); });
                    }),
                  ],
                ),
              );
            }).toList(),
            TextButton.icon(
              onPressed: () {
                setState(() { widget.biodata.projects.add(ProjectItem()); _notifyChange(); });
              },
              icon: const Icon(Icons.add_circle, color: Colors.green),
              label: const Text('Add Project'),
            )
          ],
        ),
      ),
    );
  }

  ExpansionPanel _buildSkillsPanel() {
    return ExpansionPanel(
      headerBuilder: (context, isExpanded) => const ListTile(title: Text('Skills List', style: TextStyle(fontWeight: FontWeight.bold))),
      isExpanded: _expandedStates[6],
      canTapOnHeader: true,
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            ...widget.biodata.skills.asMap().entries.map((entry) {
              int idx = entry.key;
              var skill = entry.value;
              return Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: Row(
                  children: [
                    Expanded(child: _buildTextField('Skill', skill, (v) => widget.biodata.skills[idx] = v)),
                    IconButton(icon: const Icon(Icons.remove_circle, color: Colors.red), onPressed: () {
                      setState(() { widget.biodata.skills.removeAt(idx); _notifyChange(); });
                    }),
                  ],
                ),
              );
            }).toList(),
            TextButton.icon(
              onPressed: () {
                setState(() { widget.biodata.skills.add(''); _notifyChange(); });
              },
              icon: const Icon(Icons.add_circle, color: Colors.green),
              label: const Text('Add Skill'),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildTextField(String label, String initialValue, Function(String) onChanged, {int maxLines = 1}) {
    return TextFormField(
      initialValue: initialValue,
      maxLines: maxLines,
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        isDense: true,
      ),
      onChanged: (val) {
        onChanged(val);
        _notifyChange();
      },
    );
  }

  Widget _buildDropdown(String label, List<String> items, String value, Function(String?) onChanged) {
    return DropdownButtonFormField<String>(
      value: items.contains(value) ? value : null,
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        isDense: true,
      ),
      items: items.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
      onChanged: (val) {
        onChanged(val);
        _notifyChange();
      },
    );
  }
}
