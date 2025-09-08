-- Enhance Profile Schema with Portfolio and Achievements
-- This script adds comprehensive profile features

-- Add portfolio and achievements columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS portfolio_url text,
ADD COLUMN IF NOT EXISTS linkedin_url text,
ADD COLUMN IF NOT EXISTS github_url text,
ADD COLUMN IF NOT EXISTS twitter_url text,
ADD COLUMN IF NOT EXISTS company text,
ADD COLUMN IF NOT EXISTS job_title text,
ADD COLUMN IF NOT EXISTS experience_years integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS education text,
ADD COLUMN IF NOT EXISTS skills text[],
ADD COLUMN IF NOT EXISTS achievements text[],
ADD COLUMN IF NOT EXISTS certifications text[],
ADD COLUMN IF NOT EXISTS languages text[],
ADD COLUMN IF NOT EXISTS availability text DEFAULT 'Available',
ADD COLUMN IF NOT EXISTS hourly_rate text,
ADD COLUMN IF NOT EXISTS preferred_work_type text[],
ADD COLUMN IF NOT EXISTS timezone text,
ADD COLUMN IF NOT EXISTS profile_completion_percentage integer DEFAULT 0;

-- Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL, -- 'award', 'certification', 'project', 'education', 'experience'
  issuer text,
  date_earned date,
  verification_url text,
  skills_gained text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create portfolio_projects table
CREATE TABLE IF NOT EXISTS public.portfolio_projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  project_url text,
  github_url text,
  demo_url text,
  technologies text[],
  category text, -- 'web', 'mobile', 'ai', 'blockchain', 'other'
  status text DEFAULT 'completed', -- 'completed', 'in_progress', 'planned'
  start_date date,
  end_date date,
  featured boolean DEFAULT false,
  images text[], -- Array of image URLs
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create work_experience table
CREATE TABLE IF NOT EXISTS public.work_experience (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company text NOT NULL,
  position text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date,
  current boolean DEFAULT false,
  location text,
  company_url text,
  achievements text[],
  skills_used text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create education table
CREATE TABLE IF NOT EXISTS public.education (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution text NOT NULL,
  degree text NOT NULL,
  field_of_study text,
  start_date date,
  end_date date,
  gpa text,
  description text,
  activities text[],
  skills_gained text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements
DROP POLICY IF EXISTS "Users can view all achievements" ON public.achievements;
DROP POLICY IF EXISTS "Users can manage their own achievements" ON public.achievements;

CREATE POLICY "Users can view all achievements" ON public.achievements
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own achievements" ON public.achievements
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for portfolio_projects
DROP POLICY IF EXISTS "Users can view all portfolio projects" ON public.portfolio_projects;
DROP POLICY IF EXISTS "Users can manage their own portfolio projects" ON public.portfolio_projects;

CREATE POLICY "Users can view all portfolio projects" ON public.portfolio_projects
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own portfolio projects" ON public.portfolio_projects
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for work_experience
DROP POLICY IF EXISTS "Users can view all work experience" ON public.work_experience;
DROP POLICY IF EXISTS "Users can manage their own work experience" ON public.work_experience;

CREATE POLICY "Users can view all work experience" ON public.work_experience
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own work experience" ON public.work_experience
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for education
DROP POLICY IF EXISTS "Users can view all education" ON public.education;
DROP POLICY IF EXISTS "Users can manage their own education" ON public.education;

CREATE POLICY "Users can view all education" ON public.education
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own education" ON public.education
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON public.achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON public.achievements(category);
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_user_id ON public.portfolio_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_category ON public.portfolio_projects(category);
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_featured ON public.portfolio_projects(featured);
CREATE INDEX IF NOT EXISTS idx_work_experience_user_id ON public.work_experience(user_id);
CREATE INDEX IF NOT EXISTS idx_work_experience_current ON public.work_experience(current);
CREATE INDEX IF NOT EXISTS idx_education_user_id ON public.education(user_id);

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS achievements_set_updated_at ON public.achievements;
CREATE TRIGGER achievements_set_updated_at
  BEFORE UPDATE ON public.achievements
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS portfolio_projects_set_updated_at ON public.portfolio_projects;
CREATE TRIGGER portfolio_projects_set_updated_at
  BEFORE UPDATE ON public.portfolio_projects
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS work_experience_set_updated_at ON public.work_experience;
CREATE TRIGGER work_experience_set_updated_at
  BEFORE UPDATE ON public.work_experience
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS education_set_updated_at ON public.education;
CREATE TRIGGER education_set_updated_at
  BEFORE UPDATE ON public.education
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Function to calculate profile completion percentage
CREATE OR REPLACE FUNCTION public.calculate_profile_completion(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  completion_score integer := 0;
  total_fields integer := 20; -- Total number of fields to check
BEGIN
  -- Check basic profile fields
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND full_name IS NOT NULL AND full_name != '') THEN
    completion_score := completion_score + 1;
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND bio IS NOT NULL AND bio != '') THEN
    completion_score := completion_score + 1;
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND location IS NOT NULL AND location != '') THEN
    completion_score := completion_score + 1;
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND avatar_url IS NOT NULL AND avatar_url != '') THEN
    completion_score := completion_score + 1;
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND website IS NOT NULL AND website != '') THEN
    completion_score := completion_score + 1;
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND linkedin_url IS NOT NULL AND linkedin_url != '') THEN
    completion_score := completion_score + 1;
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND github_url IS NOT NULL AND github_url != '') THEN
    completion_score := completion_score + 1;
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND company IS NOT NULL AND company != '') THEN
    completion_score := completion_score + 1;
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND job_title IS NOT NULL AND job_title != '') THEN
    completion_score := completion_score + 1;
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND skills IS NOT NULL AND array_length(skills, 1) > 0) THEN
    completion_score := completion_score + 1;
  END IF;
  
  -- Check if user has work experience
  IF EXISTS (SELECT 1 FROM public.work_experience WHERE user_id = p_user_id) THEN
    completion_score := completion_score + 2;
  END IF;
  
  -- Check if user has education
  IF EXISTS (SELECT 1 FROM public.education WHERE user_id = p_user_id) THEN
    completion_score := completion_score + 2;
  END IF;
  
  -- Check if user has portfolio projects
  IF EXISTS (SELECT 1 FROM public.portfolio_projects WHERE user_id = p_user_id) THEN
    completion_score := completion_score + 2;
  END IF;
  
  -- Check if user has achievements
  IF EXISTS (SELECT 1 FROM public.achievements WHERE user_id = p_user_id) THEN
    completion_score := completion_score + 2;
  END IF;
  
  -- Check if user has created startups
  IF EXISTS (SELECT 1 FROM public.startups WHERE owner_id = p_user_id) THEN
    completion_score := completion_score + 3;
  END IF;
  
  -- Calculate percentage
  RETURN (completion_score * 100) / total_fields;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update profile completion percentage
CREATE OR REPLACE FUNCTION public.update_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the profile completion percentage
  UPDATE public.profiles 
  SET profile_completion_percentage = public.calculate_profile_completion(NEW.user_id)
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers to update profile completion
DROP TRIGGER IF EXISTS update_profile_completion_on_work_experience ON public.work_experience;
CREATE TRIGGER update_profile_completion_on_work_experience
  AFTER INSERT OR UPDATE OR DELETE ON public.work_experience
  FOR EACH ROW EXECUTE PROCEDURE public.update_profile_completion();

DROP TRIGGER IF EXISTS update_profile_completion_on_education ON public.education;
CREATE TRIGGER update_profile_completion_on_education
  AFTER INSERT OR UPDATE OR DELETE ON public.education
  FOR EACH ROW EXECUTE PROCEDURE public.update_profile_completion();

DROP TRIGGER IF EXISTS update_profile_completion_on_portfolio ON public.portfolio_projects;
CREATE TRIGGER update_profile_completion_on_portfolio
  AFTER INSERT OR UPDATE OR DELETE ON public.portfolio_projects
  FOR EACH ROW EXECUTE PROCEDURE public.update_profile_completion();

DROP TRIGGER IF EXISTS update_profile_completion_on_achievements ON public.achievements;
CREATE TRIGGER update_profile_completion_on_achievements
  AFTER INSERT OR UPDATE OR DELETE ON public.achievements
  FOR EACH ROW EXECUTE PROCEDURE public.update_profile_completion();

DROP TRIGGER IF EXISTS update_profile_completion_on_startups ON public.startups;
CREATE TRIGGER update_profile_completion_on_startups
  AFTER INSERT OR UPDATE OR DELETE ON public.startups
  FOR EACH ROW EXECUTE PROCEDURE public.update_profile_completion();

-- Add comments for documentation
COMMENT ON TABLE public.achievements IS 'User achievements, awards, and certifications';
COMMENT ON TABLE public.portfolio_projects IS 'User portfolio projects and work samples';
COMMENT ON TABLE public.work_experience IS 'User work experience and employment history';
COMMENT ON TABLE public.education IS 'User education and academic background';
COMMENT ON COLUMN public.profiles.profile_completion_percentage IS 'Profile completion percentage (0-100)';

-- Success message
SELECT 'PROFILE SCHEMA ENHANCEMENT COMPLETED SUCCESSFULLY!' as status;
