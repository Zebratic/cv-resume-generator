'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { StyledInput } from '@/components/ui/styled-input';
import { markdownToHtml, markdownToPlainText } from '@/lib/markdown';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileText, Download, Save, Upload, Trash2, Copy, Plus, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface CvData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  linkedin: string;
  website: string;
  currentJob: string;
  summary: string;
  profilePhoto: string;
  layout: string;
  language: string;
  customLabels: {
    professionalSummary: string;
    workExperience: string;
    education: string;
    skills: string;
    projects: string;
    certifications: string;
    languages: string;
    email: string;
    phone: string;
    address: string;
    technologies: string;
  };
  experience: Array<{
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    location: string;
    year: string;
    description: string;
  }>;
  skills: string;
  projects: Array<{
    name: string;
    technologies: string;
    description: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
  languages: Array<{
    name: string;
    level: string;
  }>;
  styling?: {
    backgroundColor?: { r: number; g: number; b: number };
    sidebarBackgroundColor?: { r: number; g: number; b: number };
    sidebarTextColor?: { r: number; g: number; b: number };
    lineSplitterColor?: { r: number; g: number; b: number };
    accentColor?: { r: number; g: number; b: number };
    mainContentBackgroundColor?: { r: number; g: number; b: number };
  };
}

const translations: Record<string, Record<string, string>> = {
  en: {
    professionalSummary: 'Professional Summary',
    workExperience: 'Work Experience',
    education: 'Education',
    skills: 'Skills',
    projects: 'Projects',
    certifications: 'Certifications',
    languages: 'Languages',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    technologies: 'Technologies',
    native: 'Native',
    fluent: 'Fluent',
    advanced: 'Advanced',
    intermediate: 'Intermediate',
    basic: 'Basic',
    conversational: 'Conversational',
    professional: 'Professional',
  },
  da: {
    professionalSummary: 'Professionel Sammendrag',
    workExperience: 'Erhvervserfaring',
    education: 'Uddannelse',
    skills: 'Færdigheder',
    projects: 'Projekter',
    certifications: 'Certificeringer',
    languages: 'Sprog',
    email: 'E-mail',
    phone: 'Telefon',
    address: 'Adresse',
    technologies: 'Teknologier',
    native: 'Modersmål',
    fluent: 'Flydende',
    advanced: 'Avanceret',
    intermediate: 'Mellemliggende',
    basic: 'Grundlæggende',
    conversational: 'Samtale',
    professional: 'Professionel',
  },
  de: {
    professionalSummary: 'Berufliche Zusammenfassung',
    workExperience: 'Berufserfahrung',
    education: 'Bildung',
    skills: 'Fähigkeiten',
    projects: 'Projekte',
    certifications: 'Zertifizierungen',
    languages: 'Sprachen',
    email: 'E-Mail',
    phone: 'Telefon',
    address: 'Adresse',
    technologies: 'Technologien',
    native: 'Muttersprache',
    fluent: 'Fließend',
    advanced: 'Fortgeschritten',
    intermediate: 'Mittelstufe',
    basic: 'Grundkenntnisse',
    conversational: 'Konversation',
    professional: 'Beruflich',
  },
};

function getLabel(cvData: CvData, key: string): string {
  const custom = cvData.customLabels?.[key as keyof typeof cvData.customLabels];
  if (custom && custom.trim()) {
    return custom;
  }
  const lang = cvData.language || 'en';
  return translations[lang]?.[key] || translations.en[key] || key;
}

function getProficiencyLevels(cvData: CvData): Array<{ value: string; label: string }> {
  const lang = cvData.language || 'en';
  const t = translations[lang] || translations.en;
  return [
    { value: 'Native', label: t.native },
    { value: 'Fluent', label: t.fluent },
    { value: 'Advanced', label: t.advanced },
    { value: 'Intermediate', label: t.intermediate },
    { value: 'Basic', label: t.basic },
    { value: 'Conversational', label: t.conversational },
    { value: 'Professional', label: t.professional },
  ];
}

function getProficiencyLabel(cvData: CvData, level: string): string {
  if (!level) return level;
  const lang = cvData.language || 'en';
  const t = translations[lang] || translations.en;
  const levelLower = level.toLowerCase();
  if (levelLower === 'native') return t.native;
  if (levelLower === 'fluent') return t.fluent;
  if (levelLower === 'advanced') return t.advanced;
  if (levelLower === 'intermediate') return t.intermediate;
  if (levelLower === 'basic') return t.basic;
  if (levelLower === 'conversational') return t.conversational;
  if (levelLower === 'professional') return t.professional;
  return level;
}

// Helper functions for color conversion
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

const initialCvData: CvData = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  linkedin: '',
  website: '',
  currentJob: '',
  summary: '',
  profilePhoto: '',
  layout: 'classic',
  language: 'en',
  customLabels: {
    professionalSummary: '',
    workExperience: '',
    education: '',
    skills: '',
    projects: '',
    certifications: '',
    languages: '',
    email: '',
    phone: '',
    address: '',
    technologies: '',
  },
  experience: [],
  education: [],
  skills: '',
  projects: [],
  certifications: [],
  languages: [],
};

export default function Home() {
  const [cvData, setCvData] = useState<CvData>(initialCvData);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cvData');
      if (saved) {
        const data = JSON.parse(saved);
        // Migrate old languages format (string) to new format (array)
        if (data.languages && typeof data.languages === 'string') {
          data.languages = data.languages.split(',').map((l: string) => {
            const trimmed = l.trim();
            const match = trimmed.match(/^(.+?)\s*\((.+?)\)$/);
            if (match) {
              return { name: match[1].trim(), level: match[2].trim() };
            }
            return { name: trimmed, level: '' };
          }).filter((l: any) => l.name);
        }
        setCvData({ ...initialCvData, ...data });
      }
    } catch (error) {
      console.error('Failed to load saved data:', error);
    }
  }, []);

  // Auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('cvData', JSON.stringify(cvData));
        toast.success('Auto-saved', { duration: 2000 });
      } catch (error) {
        console.error('Auto-save failed:', error);
        toast.error('Auto-save failed');
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [cvData]);

  const updateField = (field: keyof CvData, value: any) => {
    setCvData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      updateField('profilePhoto', result);
    };
    reader.readAsDataURL(file);
  };

  const loadSampleData = () => {
    if (!window.confirm('This will replace all current data. Continue?')) return;
    const sample: CvData = {
      ...initialCvData,
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      address: '123 Main Street, San Francisco, CA 94102',
      currentJob: 'Senior Software Engineer',
      summary: 'Experienced software engineer with 5+ years of expertise in full-stack development.',
      experience: [
        {
          title: 'Senior Software Engineer',
          company: 'Tech Corp',
          location: 'San Francisco, CA',
          startDate: 'Jan 2020',
          endDate: 'Present',
          description: 'Lead development of microservices architecture.'
        }
      ],
      education: [
        {
          degree: 'Bachelor of Science in Computer Science',
          institution: 'University of California',
          location: 'Berkeley, CA',
          year: '2018',
          description: ''
        }
      ],
      skills: 'JavaScript, Python, React, Node.js, MongoDB, PostgreSQL, Docker, AWS, Git',
      projects: [
        {
          name: 'E-commerce Platform',
          technologies: 'React, Node.js, MongoDB',
          description: 'Built a full-stack e-commerce platform with payment integration.'
        }
      ],
      certifications: [
        {
          name: 'AWS Certified Solutions Architect',
          issuer: 'Amazon Web Services',
          date: '2023'
        }
      ],
      languages: [
        { name: 'English', level: 'Native' },
        { name: 'Spanish', level: 'Conversational' }
      ]
    };
    setCvData(sample);
  };

  const saveToLocal = () => {
    try {
      localStorage.setItem('cvData', JSON.stringify(cvData));
      toast.success('Saved!');
    } catch (error) {
      toast.error('Failed to save: ' + (error as Error).message);
    }
  };

  const loadFromLocal = () => {
    try {
      const saved = localStorage.getItem('cvData');
      if (!saved) {
        toast.error('No saved data found');
        return;
      }
      const data = JSON.parse(saved);
      setCvData({ ...initialCvData, ...data });
      toast.success('Loaded!');
    } catch (error) {
      toast.error('Failed to load: ' + (error as Error).message);
    }
  };

  const exportJSON = () => {
    try {
      const json = JSON.stringify(cvData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cv-data.json';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Exported!');
    } catch (error) {
      toast.error('Failed to export: ' + (error as Error).message);
    }
  };

  const importJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          setCvData({ ...initialCvData, ...data });
          toast.success('Imported!');
        } catch (error) {
          toast.error('Failed to import: Invalid JSON file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const clearForm = () => {
    if (!window.confirm('Are you sure you want to clear all data?')) return;
    setCvData(initialCvData);
  };

  const downloadFile = async (format: string) => {
    if (!cvData.fullName || !cvData.email) {
      toast.error('Please fill in at least Full Name and Email');
      return;
    }

    try {
      const response = await fetch(`/api/generate/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...cvData,
          skills: cvData.skills.split(',').map(s => s.trim()).filter(s => s)
        })
      });

      if (!response.ok) throw new Error('Generation failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Strip Markdown and HTML tags from filename
      const cleanName = markdownToPlainText(cvData.fullName).replace(/\s+/g, '_');
      a.download = `${cleanName}_CV.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Error: ' + (error as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-2 mb-6 p-4 bg-card border rounded-lg">
          <Button variant="outline" size="sm" onClick={loadSampleData}>
            <FileText className="mr-2 h-4 w-4" /> Sample Data
          </Button>
          <Button variant="outline" size="sm" onClick={saveToLocal}>
            <Save className="mr-2 h-4 w-4" /> Save
          </Button>
          <Button variant="outline" size="sm" onClick={loadFromLocal}>
            <Upload className="mr-2 h-4 w-4" /> Load
          </Button>
          <Button variant="outline" size="sm" onClick={exportJSON}>
            <Download className="mr-2 h-4 w-4" /> Export JSON
          </Button>
          <Button variant="outline" size="sm" onClick={importJSON}>
            <Upload className="mr-2 h-4 w-4" /> Import JSON
          </Button>
          <Button variant="outline" size="sm" onClick={clearForm}>
            <Trash2 className="mr-2 h-4 w-4" /> Clear
          </Button>
          <div className="flex items-center gap-2 ml-auto">
            <Label htmlFor="language">Language:</Label>
            <Select value={cvData.language || 'en'} onValueChange={(value) => updateField('language', value)}>
              <SelectTrigger id="language" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="da">Danish</SelectItem>
                <SelectItem value="de">German</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Label htmlFor="layout">Layout:</Label>
            <Select value={cvData.layout} onValueChange={(value) => updateField('layout', value)}>
              <SelectTrigger id="layout" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="classic">Classic</SelectItem>
                <SelectItem value="modern">Modern</SelectItem>
                <SelectItem value="compact">Compact</SelectItem>
                <SelectItem value="sidebar">Sidebar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 ml-4 border-l pl-4">
            <Label className="text-sm text-muted-foreground">Export:</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadFile('pdf')}
            >
              <Download className="mr-2 h-4 w-4" /> PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Column */}
          <div>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="!grid w-full grid-cols-5 mb-4 gap-1 h-auto">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="experience">Experience</TabsTrigger>
                <TabsTrigger value="education">Education</TabsTrigger>
                <TabsTrigger value="skills">Skills</TabsTrigger>
                <TabsTrigger value="languages">Languages</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="certifications">Certifications</TabsTrigger>
                <TabsTrigger value="labels">Labels</TabsTrigger>
                <TabsTrigger value="styling">Styling</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profilePhoto">Profile Photo</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="profilePhoto"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    {cvData.profilePhoto && (
                      <img
                        src={cvData.profilePhoto}
                        alt="Profile"
                        className="w-24 h-24 rounded-lg object-cover border"
                      />
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('profilePhoto')?.click()}
                    >
                      <ImageIcon className="mr-2 h-4 w-4" /> Upload Photo
                    </Button>
                    {cvData.profilePhoto && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateField('profilePhoto', '')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <StyledInput
                    id="fullName"
                    value={cvData.fullName}
                    onChange={(value) => updateField('fullName', value)}
                    label="Full Name *"
                    showStyleControls={true}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={cvData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={cvData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentJob">Current Job</Label>
                    <Input
                      id="currentJob"
                      value={cvData.currentJob}
                      onChange={(e) => updateField('currentJob', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={cvData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      value={cvData.linkedin}
                      onChange={(e) => updateField('linkedin', e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={cvData.website}
                      onChange={(e) => updateField('website', e.target.value)}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <RichTextEditor
                    value={cvData.summary}
                    onChange={(value) => updateField('summary', value)}
                    placeholder="Enter your professional summary..."
                    rows={4}
                    label="Professional Summary"
                  />
                </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="experience">
                <Card>
                  <CardHeader>
                    <CardTitle>Work Experience</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                {cvData.experience.map((exp, index) => (
                  <Card key={index} className="relative">
                    <CardContent className="pt-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          const newExp = [...cvData.experience];
                          newExp.splice(index, 1);
                          updateField('experience', newExp);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <StyledInput
                            value={exp.title}
                            onChange={(value) => {
                              const newExp = [...cvData.experience];
                              newExp[index].title = value;
                              updateField('experience', newExp);
                            }}
                            label="Job Title"
                            showStyleControls={true}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Company</Label>
                            <Input
                              value={exp.company}
                              onChange={(e) => {
                                const newExp = [...cvData.experience];
                                newExp[index].company = e.target.value;
                                updateField('experience', newExp);
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Location</Label>
                            <Input
                              value={exp.location}
                              onChange={(e) => {
                                const newExp = [...cvData.experience];
                                newExp[index].location = e.target.value;
                                updateField('experience', newExp);
                              }}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input
                              value={exp.startDate}
                              onChange={(e) => {
                                const newExp = [...cvData.experience];
                                newExp[index].startDate = e.target.value;
                                updateField('experience', newExp);
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>End Date</Label>
                            <Input
                              value={exp.endDate}
                              onChange={(e) => {
                                const newExp = [...cvData.experience];
                                newExp[index].endDate = e.target.value;
                                updateField('experience', newExp);
                              }}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <RichTextEditor
                            value={exp.description}
                            onChange={(value) => {
                              const newExp = [...cvData.experience];
                              newExp[index].description = value;
                              updateField('experience', newExp);
                            }}
                            placeholder="Enter job description..."
                            rows={3}
                            label="Description"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button
                  variant="outline"
                  onClick={() => {
                    updateField('experience', [
                      ...cvData.experience,
                      { title: '', company: '', location: '', startDate: '', endDate: '', description: '' }
                    ]);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Experience
                </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="education">
                <Card>
                  <CardHeader>
                    <CardTitle>Education</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                {cvData.education.map((edu, index) => (
                  <Card key={index} className="relative">
                    <CardContent className="pt-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          const newEdu = [...cvData.education];
                          newEdu.splice(index, 1);
                          updateField('education', newEdu);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <StyledInput
                            value={edu.degree}
                            onChange={(value) => {
                              const newEdu = [...cvData.education];
                              newEdu[index].degree = value;
                              updateField('education', newEdu);
                            }}
                            label="Degree"
                            showStyleControls={true}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Institution</Label>
                            <Input
                              value={edu.institution}
                              onChange={(e) => {
                                const newEdu = [...cvData.education];
                                newEdu[index].institution = e.target.value;
                                updateField('education', newEdu);
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Location</Label>
                            <Input
                              value={edu.location}
                              onChange={(e) => {
                                const newEdu = [...cvData.education];
                                newEdu[index].location = e.target.value;
                                updateField('education', newEdu);
                              }}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Year</Label>
                            <Input
                              value={edu.year}
                              onChange={(e) => {
                                const newEdu = [...cvData.education];
                                newEdu[index].year = e.target.value;
                                updateField('education', newEdu);
                              }}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <RichTextEditor
                            value={edu.description || ''}
                            onChange={(value) => {
                              const newEdu = [...cvData.education];
                              newEdu[index].description = value;
                              updateField('education', newEdu);
                            }}
                            placeholder="Enter education description..."
                            rows={3}
                            label="Description"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button
                  variant="outline"
                  onClick={() => {
                    updateField('education', [
                      ...cvData.education,
                      { degree: '', institution: '', location: '', year: '', description: '' }
                    ]);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Education
                </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="skills">
                <Card>
                  <CardHeader>
                    <CardTitle>Skills</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor="skills">Skills (comma-separated)</Label>
                      <Input
                        id="skills"
                        value={cvData.skills}
                        onChange={(e) => updateField('skills', e.target.value)}
                        placeholder="e.g., JavaScript, Python, React"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="languages">
                <Card>
                  <CardHeader>
                    <CardTitle>Languages</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {cvData.languages.map((lang, index) => (
                      <Card key={index} className="relative">
                        <CardContent className="pt-6">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              const newLangs = [...cvData.languages];
                              newLangs.splice(index, 1);
                              updateField('languages', newLangs);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Language</Label>
                              <Input
                                value={lang.name}
                                onChange={(e) => {
                                  const newLangs = [...cvData.languages];
                                  newLangs[index].name = e.target.value;
                                  updateField('languages', newLangs);
                                }}
                                placeholder="e.g., English"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Proficiency Level</Label>
                              <Select
                                value={lang.level}
                                onValueChange={(value) => {
                                  const newLangs = [...cvData.languages];
                                  newLangs[index].level = value;
                                  updateField('languages', newLangs);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                                <SelectContent>
                                  {getProficiencyLevels(cvData).map((level) => (
                                    <SelectItem key={level.value} value={level.value}>
                                      {level.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() => {
                        updateField('languages', [
                          ...cvData.languages,
                          { name: '', level: '' }
                        ]);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Language
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="projects">
                <Card>
                  <CardHeader>
                    <CardTitle>Projects</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {cvData.projects.map((proj, index) => (
                      <Card key={index} className="relative">
                        <CardContent className="pt-6">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              const newProj = [...cvData.projects];
                              newProj.splice(index, 1);
                              updateField('projects', newProj);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <StyledInput
                                value={proj.name}
                                onChange={(value) => {
                                  const newProj = [...cvData.projects];
                                  newProj[index].name = value;
                                  updateField('projects', newProj);
                                }}
                                label="Project Name"
                                showStyleControls={true}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Technologies</Label>
                              <Input
                                value={proj.technologies}
                                onChange={(e) => {
                                  const newProj = [...cvData.projects];
                                  newProj[index].technologies = e.target.value;
                                  updateField('projects', newProj);
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <RichTextEditor
                                value={proj.description}
                                onChange={(value) => {
                                  const newProj = [...cvData.projects];
                                  newProj[index].description = value;
                                  updateField('projects', newProj);
                                }}
                                placeholder="Enter project description..."
                                rows={3}
                                label="Description"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() => {
                        updateField('projects', [
                          ...cvData.projects,
                          { name: '', technologies: '', description: '' }
                        ]);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Project
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="certifications">
                <Card>
                  <CardHeader>
                    <CardTitle>Certifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {cvData.certifications.map((cert, index) => (
                      <Card key={index} className="relative">
                        <CardContent className="pt-6">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              const newCert = [...cvData.certifications];
                              newCert.splice(index, 1);
                              updateField('certifications', newCert);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <StyledInput
                                value={cert.name}
                                onChange={(value) => {
                                  const newCert = [...cvData.certifications];
                                  newCert[index].name = value;
                                  updateField('certifications', newCert);
                                }}
                                label="Certification Name"
                                showStyleControls={true}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Issuer</Label>
                                <Input
                                  value={cert.issuer}
                                  onChange={(e) => {
                                    const newCert = [...cvData.certifications];
                                    newCert[index].issuer = e.target.value;
                                    updateField('certifications', newCert);
                                  }}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Date</Label>
                                <Input
                                  value={cert.date}
                                  onChange={(e) => {
                                    const newCert = [...cvData.certifications];
                                    newCert[index].date = e.target.value;
                                    updateField('certifications', newCert);
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() => {
                        updateField('certifications', [
                          ...cvData.certifications,
                          { name: '', issuer: '', date: '' }
                        ]);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Certification
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="labels">
                <Card>
                  <CardHeader>
                    <CardTitle>Custom Labels</CardTitle>
                    <CardDescription>
                      Override section titles with custom text. Leave empty to use language defaults.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="labelProfessionalSummary">Professional Summary</Label>
                        <Input
                          id="labelProfessionalSummary"
                          value={cvData.customLabels?.professionalSummary || ''}
                          onChange={(e) => updateField('customLabels', { ...cvData.customLabels, professionalSummary: e.target.value })}
                          placeholder={getLabel(cvData, 'professionalSummary')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="labelWorkExperience">Work Experience</Label>
                        <Input
                          id="labelWorkExperience"
                          value={cvData.customLabels?.workExperience || ''}
                          onChange={(e) => updateField('customLabels', { ...cvData.customLabels, workExperience: e.target.value })}
                          placeholder={getLabel(cvData, 'workExperience')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="labelEducation">Education</Label>
                        <Input
                          id="labelEducation"
                          value={cvData.customLabels?.education || ''}
                          onChange={(e) => updateField('customLabels', { ...cvData.customLabels, education: e.target.value })}
                          placeholder={getLabel(cvData, 'education')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="labelSkills">Skills</Label>
                        <Input
                          id="labelSkills"
                          value={cvData.customLabels?.skills || ''}
                          onChange={(e) => updateField('customLabels', { ...cvData.customLabels, skills: e.target.value })}
                          placeholder={getLabel(cvData, 'skills')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="labelProjects">Projects</Label>
                        <Input
                          id="labelProjects"
                          value={cvData.customLabels?.projects || ''}
                          onChange={(e) => updateField('customLabels', { ...cvData.customLabels, projects: e.target.value })}
                          placeholder={getLabel(cvData, 'projects')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="labelCertifications">Certifications</Label>
                        <Input
                          id="labelCertifications"
                          value={cvData.customLabels?.certifications || ''}
                          onChange={(e) => updateField('customLabels', { ...cvData.customLabels, certifications: e.target.value })}
                          placeholder={getLabel(cvData, 'certifications')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="labelLanguages">Languages</Label>
                        <Input
                          id="labelLanguages"
                          value={cvData.customLabels?.languages || ''}
                          onChange={(e) => updateField('customLabels', { ...cvData.customLabels, languages: e.target.value })}
                          placeholder={getLabel(cvData, 'languages')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="labelTechnologies">Technologies</Label>
                        <Input
                          id="labelTechnologies"
                          value={cvData.customLabels?.technologies || ''}
                          onChange={(e) => updateField('customLabels', { ...cvData.customLabels, technologies: e.target.value })}
                          placeholder={getLabel(cvData, 'technologies')}
                        />
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => updateField('customLabels', {
                        professionalSummary: '',
                        workExperience: '',
                        education: '',
                        skills: '',
                        projects: '',
                        certifications: '',
                        languages: '',
                        email: '',
                        phone: '',
                        address: '',
                        technologies: '',
                      })}
                    >
                      Reset All Labels
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="styling">
                <Card>
                  <CardHeader>
                    <CardTitle>Color Styling</CardTitle>
                    <CardDescription>
                      Customize RGB colors for different elements. Leave empty to use defaults.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Background Colors</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Background Color</Label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="color"
                              value={cvData.styling?.backgroundColor ? rgbToHex(cvData.styling.backgroundColor.r, cvData.styling.backgroundColor.g, cvData.styling.backgroundColor.b) : '#ffffff'}
                              onChange={(e) => {
                                const rgb = hexToRgb(e.target.value);
                                if (rgb) {
                                  updateField('styling', {
                                    ...cvData.styling,
                                    backgroundColor: rgb,
                                  });
                                }
                              }}
                              className="w-20 h-10 rounded border cursor-pointer"
                            />
                            <div
                              className="w-12 h-10 rounded border"
                              style={{
                                backgroundColor: cvData.styling?.backgroundColor ? `rgb(${cvData.styling.backgroundColor.r}, ${cvData.styling.backgroundColor.g}, ${cvData.styling.backgroundColor.b})` : '#ffffff',
                              }}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Main Content Background</Label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="color"
                              value={cvData.styling?.mainContentBackgroundColor ? rgbToHex(cvData.styling.mainContentBackgroundColor.r, cvData.styling.mainContentBackgroundColor.g, cvData.styling.mainContentBackgroundColor.b) : '#ffffff'}
                              onChange={(e) => {
                                const rgb = hexToRgb(e.target.value);
                                if (rgb) {
                                  updateField('styling', {
                                    ...cvData.styling,
                                    mainContentBackgroundColor: rgb,
                                  });
                                }
                              }}
                              className="w-20 h-10 rounded border cursor-pointer"
                            />
                            <div
                              className="w-12 h-10 rounded border"
                              style={{
                                backgroundColor: cvData.styling?.mainContentBackgroundColor ? `rgb(${cvData.styling.mainContentBackgroundColor.r}, ${cvData.styling.mainContentBackgroundColor.g}, ${cvData.styling.mainContentBackgroundColor.b})` : '#ffffff',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold">Sidebar Colors (for Sidebar layout)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Sidebar Background</Label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="color"
                              value={cvData.styling?.sidebarBackgroundColor ? rgbToHex(cvData.styling.sidebarBackgroundColor.r, cvData.styling.sidebarBackgroundColor.g, cvData.styling.sidebarBackgroundColor.b) : '#1e3a8a'}
                              onChange={(e) => {
                                const rgb = hexToRgb(e.target.value);
                                if (rgb) {
                                  updateField('styling', {
                                    ...cvData.styling,
                                    sidebarBackgroundColor: rgb,
                                  });
                                }
                              }}
                              className="w-20 h-10 rounded border cursor-pointer"
                            />
                            <div
                              className="w-12 h-10 rounded border"
                              style={{
                                backgroundColor: cvData.styling?.sidebarBackgroundColor ? `rgb(${cvData.styling.sidebarBackgroundColor.r}, ${cvData.styling.sidebarBackgroundColor.g}, ${cvData.styling.sidebarBackgroundColor.b})` : '#1e3a8a',
                              }}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Sidebar Text</Label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="color"
                              value={cvData.styling?.sidebarTextColor ? rgbToHex(cvData.styling.sidebarTextColor.r, cvData.styling.sidebarTextColor.g, cvData.styling.sidebarTextColor.b) : '#ffffff'}
                              onChange={(e) => {
                                const rgb = hexToRgb(e.target.value);
                                if (rgb) {
                                  updateField('styling', {
                                    ...cvData.styling,
                                    sidebarTextColor: rgb,
                                  });
                                }
                              }}
                              className="w-20 h-10 rounded border cursor-pointer"
                            />
                            <div
                              className="w-12 h-10 rounded border"
                              style={{
                                backgroundColor: cvData.styling?.sidebarTextColor ? `rgb(${cvData.styling.sidebarTextColor.r}, ${cvData.styling.sidebarTextColor.g}, ${cvData.styling.sidebarTextColor.b})` : '#ffffff',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold">Accent & Divider Colors</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Line Splitter/Divider</Label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="color"
                              value={cvData.styling?.lineSplitterColor ? rgbToHex(cvData.styling.lineSplitterColor.r, cvData.styling.lineSplitterColor.g, cvData.styling.lineSplitterColor.b) : '#2563eb'}
                              onChange={(e) => {
                                const rgb = hexToRgb(e.target.value);
                                if (rgb) {
                                  updateField('styling', {
                                    ...cvData.styling,
                                    lineSplitterColor: rgb,
                                  });
                                }
                              }}
                              className="w-20 h-10 rounded border cursor-pointer"
                            />
                            <div
                              className="w-12 h-10 rounded border"
                              style={{
                                backgroundColor: cvData.styling?.lineSplitterColor ? `rgb(${cvData.styling.lineSplitterColor.r}, ${cvData.styling.lineSplitterColor.g}, ${cvData.styling.lineSplitterColor.b})` : '#2563eb',
                              }}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Accent Color</Label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="color"
                              value={cvData.styling?.accentColor ? rgbToHex(cvData.styling.accentColor.r, cvData.styling.accentColor.g, cvData.styling.accentColor.b) : '#2563eb'}
                              onChange={(e) => {
                                const rgb = hexToRgb(e.target.value);
                                if (rgb) {
                                  updateField('styling', {
                                    ...cvData.styling,
                                    accentColor: rgb,
                                  });
                                }
                              }}
                              className="w-20 h-10 rounded border cursor-pointer"
                            />
                            <div
                              className="w-12 h-10 rounded border"
                              style={{
                                backgroundColor: cvData.styling?.accentColor ? `rgb(${cvData.styling.accentColor.r}, ${cvData.styling.accentColor.g}, ${cvData.styling.accentColor.b})` : '#2563eb',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => updateField('styling', undefined)}
                    >
                      Reset All Colors
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview Column */}
          <div className="lg:sticky lg:top-4 h-fit">
            <Card>
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <PreviewContent cvData={cvData} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewContent({ cvData }: { cvData: CvData }) {
  const hasContent = cvData.fullName || cvData.email || cvData.summary ||
    cvData.experience.length > 0 || cvData.education.length > 0 ||
    cvData.skills || cvData.projects.length > 0 ||
    cvData.certifications.length > 0 || cvData.languages.length > 0;

  if (!hasContent) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>Start filling out the form to see your CV preview</p>
      </div>
    );
  }

  const layout = cvData.layout || 'classic';

  // Helper function to get RGB color string
  const getRgbColor = (color?: { r: number; g: number; b: number }, defaultColor?: string): string => {
    if (color && color.r !== undefined && color.g !== undefined && color.b !== undefined) {
      return `rgb(${color.r}, ${color.g}, ${color.b})`;
    }
    return defaultColor || '';
  };

  // Helper function to render Markdown content as HTML
  const renderMarkdown = (markdown: string) => {
    if (!markdown) return '';
    return markdownToHtml(markdown);
  };

  // Get styling colors with defaults
  const bgColor = getRgbColor(cvData.styling?.backgroundColor, 'rgb(255, 255, 255)');
  const mainBgColor = getRgbColor(cvData.styling?.mainContentBackgroundColor, 'rgb(255, 255, 255)');
  const sidebarBgColor = getRgbColor(cvData.styling?.sidebarBackgroundColor, 'rgb(30, 58, 138)');
  const sidebarTextColor = getRgbColor(cvData.styling?.sidebarTextColor, 'rgb(255, 255, 255)');
  const lineSplitterColor = getRgbColor(cvData.styling?.lineSplitterColor, 'rgb(37, 99, 235)');
  const accentColor = getRgbColor(cvData.styling?.accentColor, 'rgb(37, 99, 235)');

  // Sidebar Layout
  if (layout === 'sidebar') {
    return (
      <div className="rounded-lg min-h-[800px] overflow-hidden" style={{ backgroundColor: bgColor, color: 'black' }}>
        <div className="flex">
          {/* Sidebar */}
          <div className="w-1/3 p-4" style={{ backgroundColor: sidebarBgColor, color: sidebarTextColor }}>
            {cvData.profilePhoto && (
              <div className="mb-4">
                <img
                  src={cvData.profilePhoto}
                  alt="Profile"
                  className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-white"
                />
              </div>
            )}
            {cvData.fullName && (
              <h1 className="text-xl font-bold text-center mb-4 markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(cvData.fullName) }} />
            )}
            {cvData.currentJob && (
              <p className="text-sm text-center mb-4" style={{ color: sidebarTextColor, opacity: 0.8 }}>{cvData.currentJob}</p>
            )}
            
            <div className="space-y-3 text-sm">
              {cvData.email && <div><strong>{getLabel(cvData, 'email')}:</strong><br/>{cvData.email}</div>}
              {cvData.phone && <div><strong>{getLabel(cvData, 'phone')}:</strong><br/>{cvData.phone}</div>}
              {cvData.address && <div><strong>{getLabel(cvData, 'address')}:</strong><br/>{cvData.address}</div>}
              {cvData.linkedin && <div><strong>LinkedIn:</strong><br/><a href={cvData.linkedin} target="_blank" rel="noopener noreferrer" className="underline">{cvData.linkedin}</a></div>}
              {cvData.website && <div><strong>Website:</strong><br/><a href={cvData.website} target="_blank" rel="noopener noreferrer" className="underline">{cvData.website}</a></div>}
            </div>

            {cvData.skills && (
              <div className="mt-6">
                <h3 className="text-lg font-bold mb-2 pb-1" style={{ borderBottomColor: lineSplitterColor, borderBottomWidth: '1px', borderBottomStyle: 'solid' }}>{getLabel(cvData, 'skills')}</h3>
                <p className="text-xs">{cvData.skills}</p>
              </div>
            )}

            {cvData.languages.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-bold mb-2 pb-1" style={{ borderBottomColor: lineSplitterColor, borderBottomWidth: '1px', borderBottomStyle: 'solid' }}>{getLabel(cvData, 'languages')}</h3>
                <div className="text-xs space-y-1">
                  {cvData.languages.map((l, i) => (
                    <div key={i}>{l.name} ({getProficiencyLabel(cvData, l.level)})</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="w-2/3 p-6" style={{ backgroundColor: mainBgColor }}>
            {cvData.summary && (
              <div className="mb-4">
                <h2 className="text-lg font-bold mb-2 pb-1" style={{ borderBottomColor: accentColor, borderBottomWidth: '2px', borderBottomStyle: 'solid' }}>{getLabel(cvData, 'professionalSummary')}</h2>
                <p className="text-sm whitespace-pre-line markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(cvData.summary) }} />
              </div>
            )}

            {cvData.experience.length > 0 && (
              <div className="mb-4">
                <h2 className="text-lg font-bold mb-2 pb-1" style={{ borderBottomColor: accentColor, borderBottomWidth: '2px', borderBottomStyle: 'solid' }}>{getLabel(cvData, 'workExperience')}</h2>
                {cvData.experience.map((exp, i) => (
                  <div key={i} className="mb-3">
                    <div className="font-bold text-sm markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(exp.title) }} />
                    <div className="text-xs text-gray-600 italic mb-1">
                      {[exp.company, exp.location, exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : ''].filter(Boolean).join(' | ')}
                    </div>
                    {exp.description && (
                      <p className="text-xs whitespace-pre-line markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(exp.description) }} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {cvData.education.length > 0 && (
              <div className="mb-4">
                <h2 className="text-lg font-bold mb-2 pb-1" style={{ borderBottomColor: accentColor, borderBottomWidth: '2px', borderBottomStyle: 'solid' }}>{getLabel(cvData, 'education')}</h2>
                {cvData.education.map((edu, i) => (
                  <div key={i} className="mb-2">
                    <div className="font-bold text-sm markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(edu.degree) }} />
                    <div className="text-xs text-gray-600 italic">
                      {[edu.institution, edu.location, edu.year].filter(Boolean).join(' | ')}
                    </div>
                    {edu.description && (
                      <p className="text-xs whitespace-pre-line mt-1 markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(edu.description) }} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {cvData.projects.length > 0 && (
              <div className="mb-4">
                <h2 className="text-lg font-bold mb-2 pb-1" style={{ borderBottomColor: accentColor, borderBottomWidth: '2px', borderBottomStyle: 'solid' }}>{getLabel(cvData, 'projects')}</h2>
                {cvData.projects.map((proj, i) => (
                  <div key={i} className="mb-3">
                    <div className="font-bold text-sm markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(proj.name) }} />
                    {proj.technologies && (
                      <div className="text-xs text-gray-600 italic mb-1">{getLabel(cvData, 'technologies')}: {proj.technologies}</div>
                    )}
                    {proj.description && (
                      <p className="text-xs whitespace-pre-line markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(proj.description) }} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {cvData.certifications.length > 0 && (
              <div className="mb-4">
                <h2 className="text-lg font-bold mb-2 pb-1" style={{ borderBottomColor: accentColor, borderBottomWidth: '2px', borderBottomStyle: 'solid' }}>{getLabel(cvData, 'certifications')}</h2>
                {cvData.certifications.map((cert, i) => (
                  <div key={i} className="text-xs mb-1">
                    <span className="markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(cert.name) }} /> {cert.issuer && `- ${cert.issuer}`} {cert.date ? `(${cert.date})` : ''}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Modern Layout
  if (layout === 'modern') {
    return (
      <div className="text-black p-8 rounded-lg min-h-[800px]" style={{ backgroundColor: mainBgColor }}>
        <div className="flex items-start gap-6 mb-6 pb-6" style={{ borderBottomColor: lineSplitterColor, borderBottomWidth: '2px', borderBottomStyle: 'solid' }}>
          {cvData.profilePhoto && (
            <img
              src={cvData.profilePhoto}
              alt="Profile"
              className="w-28 h-28 rounded-lg object-cover border-2 border-gray-300"
            />
          )}
          <div className="flex-1">
            {cvData.fullName && (
              <h1 className="text-3xl font-bold mb-2 text-gray-900 markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(cvData.fullName) }} />
            )}
            {cvData.currentJob && (
              <p className="text-lg text-gray-600 mb-3">{cvData.currentJob}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {cvData.email && <span>{cvData.email}</span>}
              {cvData.phone && <span>{cvData.phone}</span>}
              {cvData.address && <span>{cvData.address}</span>}
              {cvData.linkedin && <span><a href={cvData.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">LinkedIn</a></span>}
              {cvData.website && <span><a href={cvData.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Website</a></span>}
            </div>
          </div>
        </div>

        {cvData.summary && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3 text-gray-900">{getLabel(cvData, 'professionalSummary')}</h2>
            <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(cvData.summary) }} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          <div>
            {cvData.experience.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-3 text-gray-900 pl-3" style={{ borderLeftColor: accentColor, borderLeftWidth: '4px', borderLeftStyle: 'solid' }}>{getLabel(cvData, 'workExperience')}</h2>
                {cvData.experience.map((exp, i) => (
                  <div key={i} className="mb-4">
                    <div className="font-bold text-sm text-gray-900 markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(exp.title) }} />
                    <div className="text-xs text-gray-600 mb-1">
                      {[exp.company, exp.location, exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : ''].filter(Boolean).join(' • ')}
                    </div>
                    {exp.description && (
                      <p className="text-xs text-gray-700 mt-1 whitespace-pre-line markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(exp.description) }} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {cvData.education.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-3 text-gray-900 pl-3" style={{ borderLeftColor: accentColor, borderLeftWidth: '4px', borderLeftStyle: 'solid' }}>{getLabel(cvData, 'education')}</h2>
                {cvData.education.map((edu, i) => (
                  <div key={i} className="mb-3">
                    <div className="font-bold text-sm text-gray-900 markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(edu.degree) }} />
                    <div className="text-xs text-gray-600">
                      {[edu.institution, edu.location, edu.year].filter(Boolean).join(' • ')}
                    </div>
                    {edu.description && (
                      <p className="text-xs text-gray-700 mt-1 whitespace-pre-line markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(edu.description) }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            {cvData.skills && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-3 text-gray-900 pl-3" style={{ borderLeftColor: accentColor, borderLeftWidth: '4px', borderLeftStyle: 'solid' }}>{getLabel(cvData, 'skills')}</h2>
                <p className="text-xs text-gray-700">{cvData.skills}</p>
              </div>
            )}

            {cvData.projects.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-3 text-gray-900 pl-3" style={{ borderLeftColor: accentColor, borderLeftWidth: '4px', borderLeftStyle: 'solid' }}>{getLabel(cvData, 'projects')}</h2>
                {cvData.projects.map((proj, i) => (
                  <div key={i} className="mb-3">
                    <div className="font-bold text-sm text-gray-900 markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(proj.name) }} />
                    {proj.technologies && (
                      <div className="text-xs text-gray-600 mb-1">{getLabel(cvData, 'technologies')}: {proj.technologies}</div>
                    )}
                    {proj.description && (
                      <p className="text-xs text-gray-700 mt-1 whitespace-pre-line markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(proj.description) }} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {cvData.certifications.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-3 text-gray-900 pl-3" style={{ borderLeftColor: accentColor, borderLeftWidth: '4px', borderLeftStyle: 'solid' }}>{getLabel(cvData, 'certifications')}</h2>
                {cvData.certifications.map((cert, i) => (
                  <div key={i} className="text-xs text-gray-700 mb-1">
                    <span className="markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(cert.name) }} /> {cert.issuer && `- ${cert.issuer}`} {cert.date ? `(${cert.date})` : ''}
                  </div>
                ))}
              </div>
            )}

            {cvData.languages.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-3 text-gray-900 pl-3" style={{ borderLeftColor: accentColor, borderLeftWidth: '4px', borderLeftStyle: 'solid' }}>{getLabel(cvData, 'languages')}</h2>
                <div className="text-xs text-gray-700 space-y-1">
                  {cvData.languages.map((l, i) => (
                    <div key={i}>{l.name} ({getProficiencyLabel(cvData, l.level)})</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Compact Layout
  if (layout === 'compact') {
    return (
      <div className="text-black p-4 rounded-lg min-h-[800px] text-xs" style={{ backgroundColor: mainBgColor }}>
        {cvData.fullName && (
          <h1 className="text-xl font-bold text-center mb-1 markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(cvData.fullName) }} />
        )}
        <div className="text-xs text-center text-gray-600 mb-3 pb-1" style={{ borderBottomColor: lineSplitterColor, borderBottomWidth: '1px', borderBottomStyle: 'solid' }}>
          {[
            cvData.email, 
            cvData.phone, 
            cvData.address, 
            cvData.currentJob
          ].filter(Boolean).join(' | ')}
          {cvData.linkedin && (
            <>
              {' | '}
              <a href={cvData.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">LinkedIn</a>
            </>
          )}
          {cvData.website && (
            <>
              {' | '}
              <a href={cvData.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Website</a>
            </>
          )}
        </div>

        {cvData.summary && (
          <div className="mb-3">
            <h2 className="text-sm font-bold mb-1 pb-0.5" style={{ borderBottomColor: lineSplitterColor, borderBottomWidth: '1px', borderBottomStyle: 'solid' }}>{getLabel(cvData, 'professionalSummary')}</h2>
            <p className="text-xs leading-tight whitespace-pre-line markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(cvData.summary) }} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            {cvData.experience.length > 0 && (
              <div className="mb-3">
                <h2 className="text-sm font-bold mb-1 pb-0.5" style={{ borderBottomColor: lineSplitterColor, borderBottomWidth: '1px', borderBottomStyle: 'solid' }}>{getLabel(cvData, 'workExperience')}</h2>
                {cvData.experience.map((exp, i) => (
                  <div key={i} className="mb-2">
                    <div className="font-bold text-xs markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(exp.title) }} />
                    <div className="text-xs text-gray-600">
                      {[exp.company, exp.startDate && exp.endDate ? `${exp.startDate}-${exp.endDate}` : ''].filter(Boolean).join(', ')}
                    </div>
                    {exp.description && (
                      <p className="text-xs leading-tight mt-0.5 markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(exp.description) }} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {cvData.education.length > 0 && (
              <div className="mb-3">
                <h2 className="text-sm font-bold mb-1 pb-0.5" style={{ borderBottomColor: lineSplitterColor, borderBottomWidth: '1px', borderBottomStyle: 'solid' }}>{getLabel(cvData, 'education')}</h2>
                {cvData.education.map((edu, i) => (
                  <div key={i} className="mb-1">
                    <div className="font-bold text-xs markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(edu.degree) }} />
                    <div className="text-xs text-gray-600">
                      {[edu.institution, edu.year].filter(Boolean).join(', ')}
                    </div>
                    {edu.description && (
                      <p className="text-xs leading-tight mt-0.5 markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(edu.description) }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            {cvData.skills && (
              <div className="mb-3">
                <h2 className="text-sm font-bold mb-1 pb-0.5" style={{ borderBottomColor: lineSplitterColor, borderBottomWidth: '1px', borderBottomStyle: 'solid' }}>{getLabel(cvData, 'skills')}</h2>
                <p className="text-xs">{cvData.skills}</p>
              </div>
            )}

            {cvData.projects.length > 0 && (
              <div className="mb-3">
                <h2 className="text-sm font-bold mb-1 pb-0.5" style={{ borderBottomColor: lineSplitterColor, borderBottomWidth: '1px', borderBottomStyle: 'solid' }}>{getLabel(cvData, 'projects')}</h2>
                {cvData.projects.map((proj, i) => (
                  <div key={i} className="mb-1">
                    <div className="font-bold text-xs markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(proj.name) }} />
                    {proj.description && (
                      <p className="text-xs leading-tight markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(proj.description) }} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {cvData.certifications.length > 0 && (
              <div className="mb-3">
                <h2 className="text-sm font-bold mb-1 pb-0.5" style={{ borderBottomColor: lineSplitterColor, borderBottomWidth: '1px', borderBottomStyle: 'solid' }}>{getLabel(cvData, 'certifications')}</h2>
                {cvData.certifications.map((cert, i) => (
                  <div key={i} className="text-xs mb-0.5">
                    {cert.name} {cert.date ? `(${cert.date})` : ''}
                  </div>
                ))}
              </div>
            )}

            {cvData.languages.length > 0 && (
              <div className="mb-3">
                <h2 className="text-sm font-bold mb-1 pb-0.5" style={{ borderBottomColor: lineSplitterColor, borderBottomWidth: '1px', borderBottomStyle: 'solid' }}>{getLabel(cvData, 'languages')}</h2>
                <div className="text-xs space-y-1">
                  {cvData.languages.map((l, i) => (
                    <div key={i}>{l.name} ({getProficiencyLabel(cvData, l.level)})</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Classic Layout (default)
  return (
    <div className="text-black p-6 rounded-lg min-h-[800px]" style={{ backgroundColor: mainBgColor }}>
      {cvData.profilePhoto && (
        <div className="text-center mb-4">
          <img
            src={cvData.profilePhoto}
            alt="Profile"
            className="w-28 h-28 rounded-full mx-auto object-cover border-4"
            style={{ borderColor: accentColor }}
          />
        </div>
      )}

      {cvData.fullName && (
        <h1 className="text-2xl font-bold text-center mb-2 markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(cvData.fullName) }} />
      )}
      <div className="text-xs text-center text-gray-600 mb-4 pb-2" style={{ borderBottomColor: lineSplitterColor, borderBottomWidth: '1px', borderBottomStyle: 'solid' }}>
        {[
          cvData.email, 
          cvData.phone, 
          cvData.address, 
          cvData.currentJob
        ].filter(Boolean).join(' | ')}
        {cvData.linkedin && (
          <>
            {' | '}
            <a href={cvData.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">LinkedIn</a>
          </>
        )}
        {cvData.website && (
          <>
            {' | '}
            <a href={cvData.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Website</a>
          </>
        )}
      </div>

      {cvData.summary && (
        <div className="mb-4">
          <h2 className="text-lg font-bold mb-2 pb-1" style={{ borderBottomColor: accentColor, borderBottomWidth: '2px', borderBottomStyle: 'solid' }}>{getLabel(cvData, 'professionalSummary')}</h2>
          <p className="text-sm whitespace-pre-line markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(cvData.summary) }} />
        </div>
      )}

      {cvData.experience.length > 0 && (
        <div className="mb-4">
          <h2 className="text-lg font-bold mb-2 pb-1" style={{ borderBottomColor: accentColor, borderBottomWidth: '2px', borderBottomStyle: 'solid' }}>{getLabel(cvData, 'workExperience')}</h2>
          {cvData.experience.map((exp, i) => (
            <div key={i} className="mb-3">
              <div className="font-bold text-sm markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(exp.title) }} />
              <div className="text-xs text-gray-600 italic mb-1">
                {[exp.company, exp.location, exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : ''].filter(Boolean).join(' | ')}
              </div>
              {exp.description && (
                <p className="text-xs whitespace-pre-line">{exp.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {cvData.education.length > 0 && (
        <div className="mb-4">
          <h2 className="text-lg font-bold mb-2 pb-1" style={{ borderBottomColor: accentColor, borderBottomWidth: '2px', borderBottomStyle: 'solid' }}>{getLabel(cvData, 'education')}</h2>
          {cvData.education.map((edu, i) => (
            <div key={i} className="mb-2">
              <div className="font-bold text-sm markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(edu.degree) }} />
              <div className="text-xs text-gray-600 italic">
                {[edu.institution, edu.location, edu.year].filter(Boolean).join(' | ')}
              </div>
              {edu.description && (
                <p className="text-xs whitespace-pre-line mt-1">{edu.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {cvData.skills && (
        <div className="mb-4">
          <h2 className="text-lg font-bold mb-2 pb-1" style={{ borderBottomColor: accentColor, borderBottomWidth: '2px', borderBottomStyle: 'solid' }}>{getLabel(cvData, 'skills')}</h2>
          <p className="text-xs">{cvData.skills}</p>
        </div>
      )}

      {cvData.projects.length > 0 && (
        <div className="mb-4">
          <h2 className="text-lg font-bold mb-2 pb-1" style={{ borderBottomColor: accentColor, borderBottomWidth: '2px', borderBottomStyle: 'solid' }}>{getLabel(cvData, 'projects')}</h2>
          {cvData.projects.map((proj, i) => (
            <div key={i} className="mb-3">
              <div className="font-bold text-sm markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(proj.name) }} />
              {proj.technologies && (
                <div className="text-xs text-gray-600 italic mb-1">{getLabel(cvData, 'technologies')}: {proj.technologies}</div>
              )}
              {proj.description && (
                <p className="text-xs whitespace-pre-line">{proj.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {cvData.certifications.length > 0 && (
        <div className="mb-4">
          <h2 className="text-lg font-bold mb-2 pb-1" style={{ borderBottomColor: accentColor, borderBottomWidth: '2px', borderBottomStyle: 'solid' }}>{getLabel(cvData, 'certifications')}</h2>
          {cvData.certifications.map((cert, i) => (
            <div key={i} className="text-xs mb-1">
              {[cert.name, cert.issuer, cert.date ? `(${cert.date})` : ''].filter(Boolean).join(' - ')}
            </div>
          ))}
        </div>
      )}

      {cvData.languages.length > 0 && (
        <div className="mb-4">
          <h2 className="text-lg font-bold mb-2 pb-1" style={{ borderBottomColor: accentColor, borderBottomWidth: '2px', borderBottomStyle: 'solid' }}>{getLabel(cvData, 'languages')}</h2>
          <div className="text-xs space-y-1">
            {cvData.languages.map((l, i) => (
              <div key={i}>{l.name} ({getProficiencyLabel(cvData, l.level)})</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

