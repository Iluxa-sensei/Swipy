-- Complete Profile System Upgrade
-- This script creates a comprehensive profile system with portfolio, achievements, and more

-- First, run the profile schema enhancement
\i ENHANCE_PROFILE_SCHEMA.sql

-- Add profile completion percentage to existing profiles
UPDATE public.profiles 
SET profile_completion_percentage = public.calculate_profile_completion(id)
WHERE profile_completion_percentage IS NULL;

-- Create some sample achievements for testing
INSERT INTO public.achievements (user_id, title, description, category, issuer, date_earned, skills_gained)
SELECT 
  id as user_id,
  'Profile Creator' as title,
  'Created a complete profile on Swipy' as description,
  'milestone' as category,
  'Swipy' as issuer,
  NOW() as date_earned,
  ARRAY['Profile Management', 'Professional Networking'] as skills_gained
FROM public.profiles 
WHERE full_name IS NOT NULL AND full_name != ''
ON CONFLICT DO NOTHING;

-- Create sample work experience for users with companies
INSERT INTO public.work_experience (user_id, company, position, description, start_date, current, location)
SELECT 
  id as user_id,
  COALESCE(company, 'Freelance') as company,
  COALESCE(job_title, 'Professional') as position,
  COALESCE(bio, 'Professional experience') as description,
  (NOW() - INTERVAL '2 years')::date as start_date,
  true as current,
  COALESCE(location, 'Remote') as location
FROM public.profiles 
WHERE company IS NOT NULL OR job_title IS NOT NULL
ON CONFLICT DO NOTHING;

-- Create sample education entries
INSERT INTO public.education (user_id, institution, degree, field_of_study, start_date, end_date)
SELECT 
  id as user_id,
  'University' as institution,
  'Bachelor Degree' as degree,
  'Computer Science' as field_of_study,
  (NOW() - INTERVAL '4 years')::date as start_date,
  (NOW() - INTERVAL '1 year')::date as end_date
FROM public.profiles 
WHERE id IN (
  SELECT DISTINCT owner_id FROM public.startups
)
ON CONFLICT DO NOTHING;

-- Create sample portfolio projects for startup owners
INSERT INTO public.portfolio_projects (user_id, title, description, project_url, technologies, category, status, start_date, end_date, featured)
SELECT 
  s.owner_id as user_id,
  s.name as title,
  s.description,
  s.website as project_url,
  ARRAY['React', 'Node.js', 'PostgreSQL'] as technologies,
  COALESCE(s.category, 'Web Development') as category,
  'completed' as status,
  s.created_at::date as start_date,
  NOW()::date as end_date,
  true as featured
FROM public.startups s
WHERE s.name IS NOT NULL
ON CONFLICT DO NOTHING;

-- Update profile completion percentages after adding sample data
UPDATE public.profiles 
SET profile_completion_percentage = public.calculate_profile_completion(id);

-- Add indexes for better performance on new tables
CREATE INDEX IF NOT EXISTS idx_profiles_completion ON public.profiles(profile_completion_percentage);
CREATE INDEX IF NOT EXISTS idx_achievements_user_category ON public.achievements(user_id, category);
CREATE INDEX IF NOT EXISTS idx_portfolio_user_featured ON public.portfolio_projects(user_id, featured);
CREATE INDEX IF NOT EXISTS idx_work_experience_user_current ON public.work_experience(user_id, current);

-- Create a view for complete profile data
CREATE OR REPLACE VIEW public.complete_profiles AS
SELECT 
  p.*,
  COALESCE(we_count.count, 0) as work_experience_count,
  COALESCE(ed_count.count, 0) as education_count,
  COALESCE(pp_count.count, 0) as portfolio_projects_count,
  COALESCE(ach_count.count, 0) as achievements_count,
  COALESCE(st_count.count, 0) as startups_count
FROM public.profiles p
LEFT JOIN (
  SELECT user_id, COUNT(*) as count 
  FROM public.work_experience 
  GROUP BY user_id
) we_count ON p.id = we_count.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) as count 
  FROM public.education 
  GROUP BY user_id
) ed_count ON p.id = ed_count.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) as count 
  FROM public.portfolio_projects 
  GROUP BY user_id
) pp_count ON p.id = pp_count.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) as count 
  FROM public.achievements 
  GROUP BY user_id
) ach_count ON p.id = ach_count.user_id
LEFT JOIN (
  SELECT owner_id, COUNT(*) as count 
  FROM public.startups 
  GROUP BY owner_id
) st_count ON p.id = st_count.owner_id;

-- Grant access to the view
GRANT SELECT ON public.complete_profiles TO authenticated;

-- Create function to get user's complete profile data
CREATE OR REPLACE FUNCTION public.get_complete_profile(p_user_id uuid)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'profile', row_to_json(p),
    'workExperience', COALESCE(we_data.data, '[]'::json),
    'education', COALESCE(ed_data.data, '[]'::json),
    'portfolioProjects', COALESCE(pp_data.data, '[]'::json),
    'achievements', COALESCE(ach_data.data, '[]'::json),
    'startups', COALESCE(st_data.data, '[]'::json)
  ) INTO result
  FROM public.profiles p
  LEFT JOIN (
    SELECT user_id, json_agg(row_to_json(we)) as data
    FROM public.work_experience we
    WHERE we.user_id = p_user_id
    GROUP BY user_id
  ) we_data ON p.id = we_data.user_id
  LEFT JOIN (
    SELECT user_id, json_agg(row_to_json(ed)) as data
    FROM public.education ed
    WHERE ed.user_id = p_user_id
    GROUP BY user_id
  ) ed_data ON p.id = ed_data.user_id
  LEFT JOIN (
    SELECT user_id, json_agg(row_to_json(pp)) as data
    FROM public.portfolio_projects pp
    WHERE pp.user_id = p_user_id
    GROUP BY user_id
  ) pp_data ON p.id = pp_data.user_id
  LEFT JOIN (
    SELECT user_id, json_agg(row_to_json(ach)) as data
    FROM public.achievements ach
    WHERE ach.user_id = p_user_id
    GROUP BY user_id
  ) ach_data ON p.id = ach_data.user_id
  LEFT JOIN (
    SELECT owner_id, json_agg(row_to_json(st)) as data
    FROM public.startups st
    WHERE st.owner_id = p_user_id
    GROUP BY owner_id
  ) st_data ON p.id = st_data.owner_id
  WHERE p.id = p_user_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_complete_profile(uuid) TO authenticated;

-- Success message
SELECT 'COMPLETE PROFILE SYSTEM UPGRADE COMPLETED SUCCESSFULLY!' as status,
       'All profile features are now available including portfolio, achievements, work experience, and education tracking.' as description;
