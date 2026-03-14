insert into public.providers (
  id,
  specialty,
  bio,
  languages,
  accepting_patients,
  consultation_fee_cents,
  rating,
  total_reviews
)
values
  (
    uuid_generate_v4(),
    'ob_gyn',
    'Board-certified OB/GYN with 12 years specializing in reproductive health and minimally invasive surgery.',
    array['English', 'Mandarin'],
    true,
    8500,
    4.9,
    132
  ),
  (
    uuid_generate_v4(),
    'fertility',
    'Reproductive endocrinologist focused on IVF, IUI, and natural fertility optimization.',
    array['English', 'French'],
    true,
    12000,
    4.8,
    98
  ),
  (
    uuid_generate_v4(),
    'mental_health',
    'Licensed therapist specializing in perinatal mental health, anxiety, and women''s life transitions.',
    array['English', 'Hindi'],
    true,
    6500,
    4.9,
    144
  ),
  (
    uuid_generate_v4(),
    'menopause',
    'Certified menopause specialist and hormone therapy expert helping women navigate midlife health.',
    array['English', 'Spanish'],
    true,
    9500,
    4.7,
    87
  ),
  (
    uuid_generate_v4(),
    'nutrition',
    'Registered dietitian specializing in hormonal health, fertility nutrition, and prenatal care.',
    array['English', 'Hindi', 'Gujarati'],
    true,
    5500,
    4.8,
    119
  );
