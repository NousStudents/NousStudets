import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Class {
  class_id: string;
  class_name: string;
  section: string;
}

interface Parent {
  parent_id: string;
  full_name: string;
}

interface EditStudentDialogTabsProps {
  formData: any;
  setFormData: (data: any) => void;
  classes: Class[];
  parents: Parent[];
}

export function EditStudentDialogTabs({ formData, setFormData, classes, parents }: EditStudentDialogTabsProps) {
  return (
    <Tabs defaultValue="personal" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="personal">Personal</TabsTrigger>
        <TabsTrigger value="academic">Academic</TabsTrigger>
        <TabsTrigger value="health">Health</TabsTrigger>
        <TabsTrigger value="family">Family</TabsTrigger>
      </TabsList>

      <TabsContent value="personal" className="space-y-4 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admission_number">Admission Number</Label>
            <Input
              id="admission_number"
              value={formData.admission_number}
              onChange={(e) => setFormData({ ...formData, admission_number: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="roll_no">Roll Number *</Label>
            <Input
              id="roll_no"
              value={formData.roll_no}
              onChange={(e) => setFormData({ ...formData, roll_no: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender *</Label>
            <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dob">Date of Birth *</Label>
            <Input
              id="dob"
              type="date"
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="blood_group">Blood Group *</Label>
            <Select value={formData.blood_group} onValueChange={(v) => setFormData({ ...formData, blood_group: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select blood group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A+">A+</SelectItem>
                <SelectItem value="A-">A-</SelectItem>
                <SelectItem value="B+">B+</SelectItem>
                <SelectItem value="B-">B-</SelectItem>
                <SelectItem value="O+">O+</SelectItem>
                <SelectItem value="O-">O-</SelectItem>
                <SelectItem value="AB+">AB+</SelectItem>
                <SelectItem value="AB-">AB-</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nationality">Nationality</Label>
            <Input
              id="nationality"
              value={formData.nationality}
              onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mother_tongue">Mother Tongue</Label>
            <Input
              id="mother_tongue"
              value={formData.mother_tongue}
              onChange={(e) => setFormData({ ...formData, mother_tongue: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="religion">Religion</Label>
            <Input
              id="religion"
              value={formData.religion}
              onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="student_phone">Student Phone</Label>
            <Input
              id="student_phone"
              value={formData.student_phone}
              onChange={(e) => setFormData({ ...formData, student_phone: e.target.value })}
              placeholder="10-digit mobile number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Alternate Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="address">Complete Address</Label>
          <Textarea
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            rows={2}
          />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="door_no">Door/Flat No</Label>
            <Input
              id="door_no"
              value={formData.door_no}
              onChange={(e) => setFormData({ ...formData, door_no: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="street">Street</Label>
            <Input
              id="street"
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="village_town">Village/Town</Label>
            <Input
              id="village_town"
              value={formData.village_town}
              onChange={(e) => setFormData({ ...formData, village_town: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="district">District</Label>
            <Input
              id="district"
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pincode">Pincode</Label>
            <Input
              id="pincode"
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              maxLength={6}
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="academic" className="space-y-4 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="class_id">Class *</Label>
            <Select value={formData.class_id} onValueChange={(v) => setFormData({ ...formData, class_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.class_id} value={c.class_id}>
                    {c.class_name} - {c.section}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="section">Section *</Label>
            <Input
              id="section"
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="academic_year">Academic Year</Label>
            <Input
              id="academic_year"
              value={formData.academic_year}
              onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
              placeholder="2024-2025"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admission_date">Date of Admission</Label>
            <Input
              id="admission_date"
              type="date"
              value={formData.admission_date}
              onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="medium_of_instruction">Medium of Instruction</Label>
            <Input
              id="medium_of_instruction"
              value={formData.medium_of_instruction}
              onChange={(e) => setFormData({ ...formData, medium_of_instruction: e.target.value })}
              placeholder="English, Hindi, etc."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="student_category">Student Category</Label>
            <Select value={formData.student_category} onValueChange={(v) => setFormData({ ...formData, student_category: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="General">General</SelectItem>
                <SelectItem value="SC">SC</SelectItem>
                <SelectItem value="ST">ST</SelectItem>
                <SelectItem value="OBC">OBC</SelectItem>
                <SelectItem value="Others">Others</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="previous_school">Previous School Name</Label>
            <Input
              id="previous_school"
              value={formData.previous_school}
              onChange={(e) => setFormData({ ...formData, previous_school: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hobbies">Hobbies</Label>
            <Input
              id="hobbies"
              value={formData.hobbies}
              onChange={(e) => setFormData({ ...formData, hobbies: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="interests">Interests/Skills</Label>
            <Input
              id="interests"
              value={formData.interests}
              onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
              placeholder="Sports, Music, Art, etc."
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="achievements">Achievements/Awards</Label>
            <Textarea
              id="achievements"
              value={formData.achievements}
              onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="languages_known">Languages Known</Label>
            <Input
              id="languages_known"
              value={formData.languages_known}
              onChange={(e) => setFormData({ ...formData, languages_known: e.target.value })}
              placeholder="English, Hindi, Tamil, etc."
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="health" className="space-y-4 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="height">Height (cm)</Label>
            <Input
              id="height"
              type="number"
              step="0.01"
              value={formData.height}
              onChange={(e) => setFormData({ ...formData, height: e.target.value })}
              placeholder="150.5"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              step="0.01"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              placeholder="45.5"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="allergies">Allergies (if any)</Label>
            <Textarea
              id="allergies"
              value={formData.allergies}
              onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
              rows={2}
              placeholder="List any known allergies"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="medical_conditions">Medical Conditions</Label>
            <Textarea
              id="medical_conditions"
              value={formData.medical_conditions}
              onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
              rows={2}
              placeholder="List any medical conditions"
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-semibold mb-4">Emergency Contact Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
              <Input
                id="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_relationship">Relationship</Label>
              <Input
                id="emergency_contact_relationship"
                value={formData.emergency_contact_relationship}
                onChange={(e) => setFormData({ ...formData, emergency_contact_relationship: e.target.value })}
                placeholder="Father, Mother, Guardian, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_mobile">Emergency Mobile Number</Label>
              <Input
                id="emergency_contact_mobile"
                value={formData.emergency_contact_mobile}
                onChange={(e) => setFormData({ ...formData, emergency_contact_mobile: e.target.value })}
                placeholder="10-digit number"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-semibold mb-4">Family Doctor (Optional)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="family_doctor_name">Doctor Name</Label>
              <Input
                id="family_doctor_name"
                value={formData.family_doctor_name}
                onChange={(e) => setFormData({ ...formData, family_doctor_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doctor_contact_number">Doctor Contact Number</Label>
              <Input
                id="doctor_contact_number"
                value={formData.doctor_contact_number}
                onChange={(e) => setFormData({ ...formData, doctor_contact_number: e.target.value })}
              />
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="family" className="space-y-4 mt-4">
        <div className="border-b pb-4">
          <h4 className="font-semibold mb-4">Father Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="father_name">Father's Name</Label>
              <Input
                id="father_name"
                value={formData.father_name}
                onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="father_phone">Father's Phone</Label>
              <Input
                id="father_phone"
                value={formData.father_phone}
                onChange={(e) => setFormData({ ...formData, father_phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="father_email">Father's Email</Label>
              <Input
                id="father_email"
                type="email"
                value={formData.father_email}
                onChange={(e) => setFormData({ ...formData, father_email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="father_occupation">Father's Occupation</Label>
              <Input
                id="father_occupation"
                value={formData.father_occupation}
                onChange={(e) => setFormData({ ...formData, father_occupation: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="border-b pb-4">
          <h4 className="font-semibold mb-4">Mother Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mother_name">Mother's Name</Label>
              <Input
                id="mother_name"
                value={formData.mother_name}
                onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mother_phone">Mother's Phone</Label>
              <Input
                id="mother_phone"
                value={formData.mother_phone}
                onChange={(e) => setFormData({ ...formData, mother_phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mother_email">Mother's Email</Label>
              <Input
                id="mother_email"
                type="email"
                value={formData.mother_email}
                onChange={(e) => setFormData({ ...formData, mother_email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mother_occupation">Mother's Occupation</Label>
              <Input
                id="mother_occupation"
                value={formData.mother_occupation}
                onChange={(e) => setFormData({ ...formData, mother_occupation: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="border-b pb-4">
          <h4 className="font-semibold mb-4">Guardian Information (if applicable)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guardian_name">Guardian Name</Label>
              <Input
                id="guardian_name"
                value={formData.guardian_name}
                onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guardian_relationship">Relationship</Label>
              <Input
                id="guardian_relationship"
                value={formData.guardian_relationship}
                onChange={(e) => setFormData({ ...formData, guardian_relationship: e.target.value })}
                placeholder="Uncle, Aunt, Grandfather, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guardian_contact">Guardian Contact</Label>
              <Input
                id="guardian_contact"
                value={formData.guardian_contact}
                onChange={(e) => setFormData({ ...formData, guardian_contact: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Parent Association</h4>
          <div className="space-y-2">
            <Label htmlFor="parent_id">Select Parent (if registered)</Label>
            <Select 
              value={formData.parent_id || "none"} 
              onValueChange={(v) => setFormData({ ...formData, parent_id: v === "none" ? "" : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select parent (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No parent linked</SelectItem>
                {parents.map((p) => (
                  <SelectItem key={p.parent_id} value={p.parent_id}>
                    {p.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
