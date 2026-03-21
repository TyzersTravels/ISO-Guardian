-- Template Marketplace Seed Data
-- Run AFTER template_marketplace_tables.sql

-- CATEGORIES
INSERT INTO template_categories (name, slug, description, icon, sort_order) VALUES
('Quality Manuals', 'quality-manuals', 'Complete management system manuals for ISO certification', 'book', 1),
('Procedures', 'procedures', 'Standard operating procedures required by ISO standards', 'clipboard', 2),
('Forms & Records', 'forms-records', 'Ready-to-use forms, checklists, and record templates', 'document', 3),
('Starter Packs', 'starter-packs', 'Complete documentation bundles to fast-track certification', 'package', 4)
ON CONFLICT (slug) DO NOTHING;
