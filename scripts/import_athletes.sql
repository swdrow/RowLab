-- Import athletes from data/athletes.csv
-- Run with: PGPASSWORD=rowlab_dev_password psql -h localhost -U rowlab -d rowlab_dev -f scripts/import_athletes.sql

-- Clear existing athletes
DELETE FROM athletes WHERE "teamId" = '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d';

-- Insert all 53 athletes from CSV
INSERT INTO athletes (id, "teamId", "firstName", "lastName", country, side, "canScull", "canCox", "isManaged", "createdAt", "updatedAt") VALUES
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Jonathan', 'Andersson', 'USA', 'Both', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Kyle', 'Brown', 'AUS', 'Starboard', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Quinn', 'Cooney', 'USA', 'Port', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Sam', 'Duncan', 'USA', 'Port', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Aidan', 'Ionescu', 'USA', 'Starboard', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Logan', 'Lyle', 'USA', 'Starboard', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Andrei', 'Malis', 'ROU', 'Starboard', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Zoran', 'Bosnic', 'SRB', 'Starboard', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Wyatt', 'Corrigan', 'USA', 'Starboard', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Milo', 'Epstein', 'USA', 'Starboard', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Charlie', 'Fortner', 'USA', 'Port', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Collin', 'Gross', 'USA', 'Port', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Griffin', 'Johnson', 'USA', 'Port', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Matthew', 'Kennedy', 'USA', 'Port', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Willem', 'Kirsch', 'DEU', 'Starboard', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Sam', 'Lozek', 'CZE', 'Both', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Marawan', 'Mohamed', 'EGY', 'Port', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Aidan', 'Seiger', 'USA', 'Port', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Kush', 'Singh', 'IND', 'Starboard', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Liam', 'Strain', 'USA', 'Port', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Ben', 'Werber', 'USA', 'Port', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Maximus', 'Wilson', 'USA', 'Starboard', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Andrei', 'Axintoi', 'ROU', 'Starboard', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Jack', 'Brennan', 'USA', 'Port', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Illia', 'Chykanov', 'UKR', 'Port', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Danillo', 'Djokic', 'SRB', 'Port', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Luke', 'Joseph', 'USA', 'Cox', false, true, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Derek', 'Kaiser', 'USA', 'Cox', false, true, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Carter', 'Lucas', 'USA', 'Starboard', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Dejan', 'Manojlovic', 'SRB', 'Port', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Jakob', 'Mauntel', 'DEU', 'Port', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Filip', 'Milanovic', 'SRB', 'Starboard', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Braeden', 'Montgomery', 'USA', 'Port', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Owen', 'Schwartz', 'USA', 'Cox', false, true, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Cole', 'Smiley', 'USA', 'Starboard', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Bartlomiej', 'Socha', 'POL', 'Starboard', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Thomas', 'Tran', 'USA', 'Cox', false, true, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'James', 'Barrett', 'USA', 'Starboard', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Noah', 'Beaton', 'CAN', 'Port', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Justus', 'Bormann', 'DEU', 'Port', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Maxwell', 'Burget', 'USA', 'Starboard', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'William', 'Bush', 'USA', 'Port', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Korey', 'Candor', 'USA', NULL, false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Isabella', 'Kurach', 'USA', 'Cox', false, true, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Lucas', 'Evers', 'USA', 'Both', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Matt', 'Firley', 'USA', 'Starboard', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Luca', 'Garvey', 'USA', 'Port', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Nathan', 'Kover', 'USA', 'Starboard', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Oscar', 'Lourie', 'AUS', 'Starboard', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Ryan', 'Miller', 'USA', 'Starboard', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Corin', 'Powell', 'USA', 'Port', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Oliver', 'Quinn', 'AUS', 'Port', false, false, true, NOW(), NOW()),
(gen_random_uuid(), '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d', 'Rodrigo', 'Segado', 'ESP', 'Both', false, false, true, NOW(), NOW());

-- Verify
SELECT COUNT(*) as total_athletes FROM athletes WHERE "teamId" = '7fea3ee7-7b64-4eb3-a604-69930a1b9e7d';
