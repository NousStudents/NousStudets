import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { GraduationCap, BookOpen, Users, BarChart3, Shield, Zap } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-4 sm:py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-primary rounded-xl">
              <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Nous
            </h1>
          </div>
          <Button onClick={() => navigate('/auth')} size="sm" className="sm:size-default">
            Get Started
          </Button>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="container mx-auto px-4 py-12 sm:py-20 text-center">
          <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Modern School Management
              <span className="block bg-gradient-primary bg-clip-text text-transparent mt-2">
                Built for the Future
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive multi-tenant platform for schools, teachers, students, and parents. 
              Streamline education with role-based access, AI tools, and complete tenant isolation.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/auth')} className="w-full sm:w-auto">
                Start Free Trial
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Learn More
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-12 sm:py-20">
          <h3 className="text-2xl sm:text-3xl font-bold text-center text-foreground mb-8 sm:mb-12">
            Everything You Need to Manage Your School
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="p-6 bg-card rounded-2xl shadow-card border border-border">
              <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h4 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Multi-Tenant Security</h4>
              <p className="text-sm sm:text-base text-muted-foreground">
                Complete data isolation per school with strict RBAC. Your data stays yours, always.
              </p>
            </div>

            <div className="p-6 bg-card rounded-2xl shadow-card border border-border">
              <div className="p-3 bg-secondary/10 rounded-xl w-fit mb-4">
                <Users className="h-6 w-6 text-secondary" />
              </div>
              <h4 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Role-Based Access</h4>
              <p className="text-sm sm:text-base text-muted-foreground">
                Separate interfaces for admins, teachers, students, and parents with precise permissions.
              </p>
            </div>

            <div className="p-6 bg-card rounded-2xl shadow-card border border-border">
              <div className="p-3 bg-success/10 rounded-xl w-fit mb-4">
                <BookOpen className="h-6 w-6 text-success" />
              </div>
              <h4 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Academic Management</h4>
              <p className="text-sm sm:text-base text-muted-foreground">
                Complete timetable, attendance, assignments, exams, and grading in one platform.
              </p>
            </div>

            <div className="p-6 bg-card rounded-2xl shadow-card border border-border">
              <div className="p-3 bg-warning/10 rounded-xl w-fit mb-4">
                <Zap className="h-6 w-6 text-warning" />
              </div>
              <h4 className="text-lg sm:text-xl font-semibold text-foreground mb-2">AI-Powered Tools</h4>
              <p className="text-sm sm:text-base text-muted-foreground">
                Smart summaries, quiz generation, AI tutoring, and personalized learning insights.
              </p>
            </div>

            <div className="p-6 bg-card rounded-2xl shadow-card border border-border">
              <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h4 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Analytics Dashboard</h4>
              <p className="text-sm sm:text-base text-muted-foreground">
                Real-time insights on attendance, performance, fees, and overall school operations.
              </p>
            </div>

            <div className="p-6 bg-card rounded-2xl shadow-card border border-border">
              <div className="p-3 bg-secondary/10 rounded-xl w-fit mb-4">
                <GraduationCap className="h-6 w-6 text-secondary" />
              </div>
              <h4 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Complete Platform</h4>
              <p className="text-sm sm:text-base text-muted-foreground">
                Library, transport, inventory, payroll, events, messaging - everything integrated.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 py-12 sm:py-20">
          <div className="bg-gradient-primary rounded-3xl p-8 sm:p-12 text-center text-white">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your School?</h3>
            <p className="text-base sm:text-lg md:text-xl opacity-90 mb-6 sm:mb-8 max-w-2xl mx-auto">
              Join modern educational institutions using Nous to streamline operations and enhance learning.
            </p>
            <Button size="lg" variant="secondary" onClick={() => navigate('/auth')} className="w-full sm:w-auto">
              Get Started Today
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-6 sm:py-8 text-center text-sm sm:text-base text-muted-foreground">
          <p>© 2025 Nous. Production-ready multi-tenant school management system.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
