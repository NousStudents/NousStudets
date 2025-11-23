import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, Download, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export default function BulkUserImport() {
  const [userType, setUserType] = useState<"student" | "teacher" | "parent">("student");
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [successCount, setSuccessCount] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (fileExtension !== 'csv') {
        toast.error("Please upload a CSV file");
        return;
      }
      setFile(selectedFile);
      setValidationErrors([]);
      setSuccessCount(0);
    }
  };

  const downloadTemplate = () => {
    let headers = "";
    let sample = "";
    
    if (userType === "student") {
      headers = "full_name,email,roll_no,class_name,section,dob,gender,phone";
      sample = "John Doe,john@example.com,001,Class 10,A,2008-01-15,Male,1234567890";
    } else if (userType === "teacher") {
      headers = "full_name,email,phone,qualification,subject_specialization,experience";
      sample = "Jane Smith,jane@example.com,9876543210,M.Sc Physics,Physics,5";
    } else {
      headers = "full_name,email,phone,relation,occupation";
      sample = "Robert Johnson,robert@example.com,5551234567,Father,Engineer";
    }

    const csvContent = `${headers}\n${sample}`;
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${userType}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Template downloaded successfully");
  };

  const validateRow = (row: any, index: number, type: string): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    if (!row.full_name?.trim()) {
      errors.push({ row: index + 2, field: "full_name", message: "Full name is required" });
    }
    
    if (!row.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      errors.push({ row: index + 2, field: "email", message: "Valid email is required" });
    }

    if (type === "student") {
      if (!row.class_name?.trim()) {
        errors.push({ row: index + 2, field: "class_name", message: "Class name is required" });
      }
    }

    return errors;
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const row: any = {};
      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });
      return row;
    });
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setImporting(true);
    setValidationErrors([]);
    setSuccessCount(0);

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      // Validate all rows
      const allErrors: ValidationError[] = [];
      rows.forEach((row, index) => {
        const errors = validateRow(row, index, userType);
        allErrors.push(...errors);
      });

      if (allErrors.length > 0) {
        setValidationErrors(allErrors);
        toast.error(`Found ${allErrors.length} validation error(s)`);
        setImporting(false);
        return;
      }

      // Get admin's school_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: adminData } = await supabase
        .from("admins")
        .select("school_id")
        .eq("auth_user_id", user.id)
        .single();

      if (!adminData?.school_id) throw new Error("School not found");

      let successfulImports = 0;

      // Import each user
      for (const row of rows) {
        try {
          // Create auth user with default password format: name@143#
          const name = row.full_name.split(' ')[0].toLowerCase() || row.email.split('@')[0];
          const defaultPassword = `${name}@143#`;
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: row.email,
            password: defaultPassword,
            options: {
              data: {
                must_change_password: true,
                full_name: row.full_name,
              }
            }
          });

          if (authError) {
            console.error(`Failed to create auth user for ${row.email}:`, authError);
            continue;
          }

          if (!authData.user) continue;

          // Insert into role-specific table
          if (userType === "student") {
            // Find class by name and section
            const { data: classData } = await supabase
              .from("classes")
              .select("class_id")
              .eq("class_name", row.class_name)
              .eq("section", row.section || "A")
              .eq("school_id", adminData.school_id)
              .single();

            await supabase.from("students").insert({
              auth_user_id: authData.user.id,
              full_name: row.full_name,
              email: row.email,
              roll_no: row.roll_no,
              class_id: classData?.class_id,
              dob: row.dob || null,
              gender: row.gender || null,
              phone: row.phone || null,
            });
          } else if (userType === "teacher") {
            await supabase.from("teachers").insert({
              auth_user_id: authData.user.id,
              full_name: row.full_name,
              email: row.email,
              phone: row.phone || null,
              qualification: row.qualification || null,
              subject_specialization: row.subject_specialization || null,
              experience: row.experience ? parseInt(row.experience) : null,
              school_id: adminData.school_id,
            });
          } else if (userType === "parent") {
            await supabase.from("parents").insert({
              auth_user_id: authData.user.id,
              full_name: row.full_name,
              email: row.email,
              phone: row.phone || null,
              relation: row.relation || null,
              occupation: row.occupation || null,
              school_id: adminData.school_id,
            });
          }

          successfulImports++;
        } catch (error) {
          console.error(`Error importing row:`, error);
        }
      }

      setSuccessCount(successfulImports);
      toast.success(`Successfully imported ${successfulImports} out of ${rows.length} users`);
      setFile(null);
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error(error.message || "Failed to import users");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Bulk User Import
        </CardTitle>
        <CardDescription>
          Import multiple users at once using CSV files
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>User Type</Label>
          <Select value={userType} onValueChange={(v: any) => setUserType(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Students</SelectItem>
              <SelectItem value="teacher">Teachers</SelectItem>
              <SelectItem value="parent">Parents</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>CSV File</Label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
            <label className="flex-1">
              <Button variant="outline" className="w-full" asChild>
                <span>
                  <FileText className="h-4 w-4 mr-2" />
                  Choose File
                </span>
              </Button>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
          {file && (
            <p className="text-sm text-muted-foreground">
              Selected: {file.name}
            </p>
          )}
        </div>

        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-2">Validation Errors:</div>
              <ul className="space-y-1 text-sm max-h-40 overflow-y-auto">
                {validationErrors.slice(0, 10).map((error, i) => (
                  <li key={i}>
                    Row {error.row}, {error.field}: {error.message}
                  </li>
                ))}
                {validationErrors.length > 10 && (
                  <li className="font-semibold">
                    ... and {validationErrors.length - 10} more errors
                  </li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {successCount > 0 && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Successfully imported {successCount} users
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleImport}
          disabled={!file || importing}
          className="w-full"
        >
          {importing ? "Importing..." : "Import Users"}
        </Button>

        <div className="text-sm text-muted-foreground space-y-2 p-4 bg-muted rounded-lg">
          <p className="font-semibold">Instructions:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Download the CSV template for your user type</li>
            <li>Fill in the user data in the template</li>
            <li>Upload the completed CSV file</li>
            <li>Review any validation errors and fix them</li>
            <li>Click "Import Users" to complete the process</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
