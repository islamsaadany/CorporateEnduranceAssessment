-- Seed sample data for The Endurance Assessment (cohort-code model).
-- Run AFTER 000_initial_schema.sql.
-- Mirrors prisma/seed.ts. Idempotent for the assessment row; ON CONFLICT for the super admin.

BEGIN;

-- Super admin
INSERT INTO "Admin" ("id", "email", "passwordHash", "name", "role", "isActive", "createdAt", "updatedAt")
VALUES ('8666d71d-618c-4f45-89dd-26ba9df32751', 'admin', '$2a$10$kKu1yr7UAgdNxySqWKnaH.xzzp0fxmvHLmclnq7aomvU55kX6WIlS', 'Super Admin', 'super_admin', TRUE, NOW(), NOW())
ON CONFLICT ("email") DO UPDATE SET
  "role" = 'super_admin',
  "isActive" = TRUE,
  "name" = EXCLUDED."name",
  "passwordHash" = EXCLUDED."passwordHash",
  "updatedAt" = NOW();

-- Capture the super admin's id (newly inserted or pre-existing).
CREATE TEMP TABLE _seed_admin AS SELECT "id" FROM "Admin" WHERE "email" = 'admin';

-- Settings singleton
INSERT INTO "Settings" ("id", "aiProvider", "promptVersion", "updatedAt")
VALUES ('singleton', 'gemini', 1, NOW())
ON CONFLICT ("id") DO NOTHING;

-- Sample assessment "Acme Corp (sample)" — delete prior copy if any (cascades to children)
DELETE FROM "Assessment" WHERE "clientName" = 'Acme Corp (sample)';

INSERT INTO "Assessment" ("id", "clientName", "code", "maxUses", "status", "deadline", "createdById", "createdAt", "updatedAt")
SELECT '82eaf73f-eec4-4375-8186-4a5e3593a104', 'Acme Corp (sample)', 'YS2SYB', 8, 'collecting', NOW() + INTERVAL '14 days', _seed_admin."id", NOW(), NOW()
FROM _seed_admin;

-- Departments
INSERT INTO "Department" ("id", "assessmentId", "name", "createdAt") VALUES
  ('6f22b91a-e69c-4396-a1b2-224549997966', '82eaf73f-eec4-4375-8186-4a5e3593a104', 'Sales',       NOW()),
  ('4d87222c-5652-4758-bd91-8facfd20a71e',   '82eaf73f-eec4-4375-8186-4a5e3593a104', 'Engineering', NOW());

-- Respondents (5 sample rows: 3 submitted, 1 in-progress, 1 fresh-no-answers).
-- All have demographicsCompletedAt set so they show up in the admin table.
INSERT INTO "Respondent" ("id", "assessmentId", "name", "departmentId", "level", "tenure", "demographicsCompletedAt", "startedAt", "submittedAt", "createdAt", "updatedAt") VALUES
  ('e8b90d79-35a8-4f32-b278-22dbcc134919', '82eaf73f-eec4-4375-8186-4a5e3593a104', 'Avery R.', '6f22b91a-e69c-4396-a1b2-224549997966', 'manager', 'y4_7', NOW(), NOW(), NOW(), NOW(), NOW()),
  ('5ea68fd0-7735-42cf-99cc-11fea89e6119', '82eaf73f-eec4-4375-8186-4a5e3593a104', 'Blake S.', '6f22b91a-e69c-4396-a1b2-224549997966', 'senior_leader', 'y8_15', NOW(), NOW(), NOW(), NOW(), NOW()),
  ('8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '82eaf73f-eec4-4375-8186-4a5e3593a104', 'Casey T.', '4d87222c-5652-4758-bd91-8facfd20a71e', 'senior_leader', 'gt_15y', NOW(), NOW(), NOW(), NOW(), NOW()),
  ('4ed876f1-19da-44e8-b667-a9cae923cc15', '82eaf73f-eec4-4375-8186-4a5e3593a104', 'Drew V.', '4d87222c-5652-4758-bd91-8facfd20a71e', 'team_leader', 'y1_3', NOW(), NOW(), NULL, NOW(), NOW()),
  ('653f086e-ff32-481f-9082-a299a8c28483', '82eaf73f-eec4-4375-8186-4a5e3593a104', 'Eli W.', '4d87222c-5652-4758-bd91-8facfd20a71e', 'individual_contributor', 'lt_1y', NOW(), NOW(), NULL, NOW(), NOW());

-- Responses (submitted respondents have all 42; #4 has 20 of 42; #5 has zero).
-- value=NULL means "I don't know" (a deliberate non-answer).
INSERT INTO "Response" ("id", "respondentId", "questionId", "value", "createdAt", "updatedAt") VALUES
  ('5251358a-3071-4ede-9fa6-f39f910675d5', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '1a', null, NOW(), NOW()),
  ('52f029e3-152d-464c-a6c9-07ef93ab7067', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '1b', 4, NOW(), NOW()),
  ('0f7d5d6c-f5a7-4e6c-a813-d8835fb067f4', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '2a', 3, NOW(), NOW()),
  ('ee2384d9-0337-490a-b026-352ef36181bc', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '2b', 2, NOW(), NOW()),
  ('94c60412-05bb-4cfc-9bb6-f13113ec7adc', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '3a', null, NOW(), NOW()),
  ('6d2174b4-3652-4e06-95d8-356fb2ab81c7', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '3b', 4, NOW(), NOW()),
  ('a8570467-3201-4ecc-9f88-ad4ab8cde932', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '4a', 3, NOW(), NOW()),
  ('604cf7d6-ba4d-48b9-bc87-14d6370ca519', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '4b', 2, NOW(), NOW()),
  ('1b61bc2b-50c9-4dd7-ab2d-5ddd3d7a4144', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '5a', null, NOW(), NOW()),
  ('ff58280b-90b3-4061-965c-f31ead31ceeb', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '5b', 4, NOW(), NOW()),
  ('003b62e1-bf83-4b23-90b0-64a41ed23af1', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '6a', 3, NOW(), NOW()),
  ('8a579911-02de-4f75-8e32-b5ec37c077f3', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '6b', 2, NOW(), NOW()),
  ('4369ba7d-9a23-4177-ba34-923bd8ed97a3', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '7a', null, NOW(), NOW()),
  ('463559f7-3479-464d-8c8b-50fff4a6dc00', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '7b', 4, NOW(), NOW()),
  ('a482337f-7b48-42fe-bfcc-792206381b98', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '8a', 3, NOW(), NOW()),
  ('fdbd4701-2e24-4880-af3f-a2c09ecf5c42', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '8b', 2, NOW(), NOW()),
  ('290035fa-9d68-471e-aa2a-ee0206dfdea0', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '9a', null, NOW(), NOW()),
  ('36474c4e-1c2d-4d7f-a47f-7764beb55e58', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '9b', 4, NOW(), NOW()),
  ('852a3e76-7613-4fb5-8bee-16da177c66b5', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '10a', 3, NOW(), NOW()),
  ('d3452c31-0b2d-4e2f-8360-7f062a5ccff9', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '10b', 2, NOW(), NOW()),
  ('c92d1ad8-7b1a-4a06-9cdd-04c1830a1729', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '11a', null, NOW(), NOW()),
  ('cd2f6631-9436-4e05-831e-627ce30496d6', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '11b', 4, NOW(), NOW()),
  ('1852f007-cc42-4f14-b7a8-9dd70320a72d', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '12a', 3, NOW(), NOW()),
  ('0cd70cdb-26ac-4939-afe7-cc900a47b2bd', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '12b', 2, NOW(), NOW()),
  ('ebc7df6f-6ff9-4f2a-b3bc-e22beae62876', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '13a', null, NOW(), NOW()),
  ('597f58eb-ec50-444f-8342-59e6b5ecf2e2', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '13b', 4, NOW(), NOW()),
  ('c7de2cf3-c8fd-41d4-b3ee-a997f793882a', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '14a', 3, NOW(), NOW()),
  ('c733f5ea-7cb3-45f0-8f9b-1673cf2ead61', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '14b', 2, NOW(), NOW()),
  ('205d97b3-0605-4c2a-9633-5fb87af2bbc1', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '15a', null, NOW(), NOW()),
  ('fa7b05ab-5e0e-4836-8293-c2c60a6eae3d', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '15b', 4, NOW(), NOW()),
  ('57a890c6-9e0e-461c-ab85-c69770d6446b', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '16a', 3, NOW(), NOW()),
  ('adf31d4f-b0c0-4d5c-b946-14f2f7767445', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '16b', 2, NOW(), NOW()),
  ('abc0f9ed-01a5-4ad8-9a14-36022e55e9bb', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '17a', null, NOW(), NOW()),
  ('67b7b49b-31fe-4f82-a53a-1bb023efdef2', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '17b', 4, NOW(), NOW()),
  ('ac300929-2119-4443-9db6-34f78ab47e83', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '18a', 3, NOW(), NOW()),
  ('c8164ee9-34aa-48a7-86ba-35e373ce679d', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '18b', 2, NOW(), NOW()),
  ('dcece0e7-72c6-4414-9879-dc4a3802953a', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '19a', null, NOW(), NOW()),
  ('14354c93-aeae-49fe-8892-530cf3be5cbd', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '19b', 4, NOW(), NOW()),
  ('6c8bf44c-4c10-4a10-af7f-5a9dc7b68e62', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '20a', 3, NOW(), NOW()),
  ('53f84719-7c81-4b11-94e1-29319a17f4ff', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '20b', 2, NOW(), NOW()),
  ('70838a2d-ba4e-4fc0-af12-052c9d21896a', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '21a', null, NOW(), NOW()),
  ('c0335c1b-3820-4634-bfd3-d3114dbf4e16', 'e8b90d79-35a8-4f32-b278-22dbcc134919', '21b', 4, NOW(), NOW()),
  ('83ba9a3f-a3a1-44fa-aad3-ee06b32322b4', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '1a', 4, NOW(), NOW()),
  ('41a102c9-cfad-4903-b51b-4ff08d27e212', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '1b', 3, NOW(), NOW()),
  ('33cca8de-c8b9-4e4d-9e41-ba13510c9543', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '2a', 2, NOW(), NOW()),
  ('36446c99-b13d-405c-a016-3d8d4112e05d', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '2b', 1, NOW(), NOW()),
  ('f2ddaff2-8039-47ac-a871-ffd95c7a0ab0', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '3a', 4, NOW(), NOW()),
  ('2dd33ff6-a863-4db3-a50d-270470f0bd23', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '3b', 3, NOW(), NOW()),
  ('b731c57b-6d3a-4a06-b1f0-43c4a39bf323', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '4a', 2, NOW(), NOW()),
  ('c1f13b21-f254-4574-a81e-a12a99e4f282', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '4b', 1, NOW(), NOW()),
  ('e5ee78fc-9a8d-4991-bdf8-e90b6c930bf8', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '5a', 4, NOW(), NOW()),
  ('e3d8957c-0d25-4a36-a362-e8741bd6ea5c', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '5b', 3, NOW(), NOW()),
  ('eb5957f3-d184-433e-8259-aff97ee9942d', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '6a', 2, NOW(), NOW()),
  ('b4b4028e-6463-42b6-a2f8-c67af1344df6', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '6b', 1, NOW(), NOW()),
  ('1abdf56c-bc9a-4674-99de-a85c9171c28d', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '7a', 4, NOW(), NOW()),
  ('7f6c9ae6-b2bc-47ea-af0b-ca4f6b298143', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '7b', 3, NOW(), NOW()),
  ('1193ee05-d2eb-4502-9268-a0a88c78a271', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '8a', 2, NOW(), NOW()),
  ('580fc03b-12b6-4ac1-bd5b-26716e2517de', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '8b', 1, NOW(), NOW()),
  ('9c8d00bc-ce6f-4033-9340-85be60eb46e6', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '9a', 4, NOW(), NOW()),
  ('db90a710-6eb2-4d59-99ad-c1445c4f77e8', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '9b', 3, NOW(), NOW()),
  ('8bfb5318-bfd4-4fe0-bf42-20b3bb44de0d', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '10a', 2, NOW(), NOW()),
  ('5df656a8-af58-4eb1-9f13-97fb90c774db', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '10b', 1, NOW(), NOW()),
  ('8b23a08a-f65d-44ae-b074-09e77789a4c1', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '11a', 4, NOW(), NOW()),
  ('758d9092-42cf-40e3-a278-92aff564138a', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '11b', 3, NOW(), NOW()),
  ('b5385857-d0be-4026-a3c1-ce1f2db55f39', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '12a', 2, NOW(), NOW()),
  ('3b8f4464-56a9-406c-8943-203557852ca7', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '12b', 1, NOW(), NOW()),
  ('8bbf5390-6f48-41a7-9ccc-0c17544d61f1', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '13a', 4, NOW(), NOW()),
  ('72875487-063f-49d4-8389-71995903e48a', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '13b', 3, NOW(), NOW()),
  ('6145a450-ca44-4b59-8105-d5f702216d89', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '14a', 2, NOW(), NOW()),
  ('9dbc49cf-487e-4062-b176-a8b3d7f32d56', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '14b', 1, NOW(), NOW()),
  ('60664026-527e-480f-b9e9-dc154ae5df38', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '15a', 4, NOW(), NOW()),
  ('ae4b6005-e53b-4993-8e0b-4568fab44afd', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '15b', 3, NOW(), NOW()),
  ('103ec1f5-605d-43ce-b633-bbd9f420fea6', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '16a', 2, NOW(), NOW()),
  ('5d066c01-4b5a-48d3-aba6-2c9dc20a5684', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '16b', 1, NOW(), NOW()),
  ('ec2d4bc2-594b-4057-b996-203ea84622f7', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '17a', 4, NOW(), NOW()),
  ('1bd69b91-3297-42c5-9068-1d101f09ee69', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '17b', 3, NOW(), NOW()),
  ('999ba06a-df3d-43d6-8d00-7fd2cce9cff6', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '18a', 2, NOW(), NOW()),
  ('fa752cd3-b6ce-4eb5-b639-1810ec4a167e', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '18b', 1, NOW(), NOW()),
  ('9a750628-2469-4107-b6e5-67be76704786', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '19a', 4, NOW(), NOW()),
  ('35e104b9-f886-4208-8871-3f5be088eeb8', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '19b', 3, NOW(), NOW()),
  ('78171d5a-45a7-4ff1-8112-fca2931687a3', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '20a', 2, NOW(), NOW()),
  ('4b1241a2-d322-4651-8665-133cf7807f84', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '20b', 1, NOW(), NOW()),
  ('26d86ab6-1381-461b-94b1-acf7d43e0075', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '21a', 4, NOW(), NOW()),
  ('62ac8540-1bb6-499e-8e06-1204f0df2073', '5ea68fd0-7735-42cf-99cc-11fea89e6119', '21b', 3, NOW(), NOW()),
  ('72f29846-cff0-4c4d-9bb7-c7a59ccf5287', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '1a', 3, NOW(), NOW()),
  ('8796ef5c-9d33-445d-8ed0-e8f2117738c3', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '1b', 2, NOW(), NOW()),
  ('ecabe481-37b6-4a75-afc8-845c45c9cb18', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '2a', 1, NOW(), NOW()),
  ('f3578345-6c05-4db6-94d7-87c2c67f0787', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '2b', 4, NOW(), NOW()),
  ('692a935d-a1be-4026-b2b6-3a2cf2762691', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '3a', 3, NOW(), NOW()),
  ('fe13113c-de3d-426f-a4c3-f3e5f6dadc08', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '3b', 2, NOW(), NOW()),
  ('845e0d4f-fc28-4b75-9b39-44f409e6f76f', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '4a', 1, NOW(), NOW()),
  ('077d60a4-1623-4a7e-a976-90f653dc1d98', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '4b', 4, NOW(), NOW()),
  ('287c8ed4-de1b-45da-b869-8528731a28a6', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '5a', 3, NOW(), NOW()),
  ('6190419d-5522-4753-8189-eba267895749', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '5b', 2, NOW(), NOW()),
  ('d3e11918-49ca-4d6d-a79f-dd7f2e6a1dd7', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '6a', 1, NOW(), NOW()),
  ('81f7a8a8-9518-49d5-9526-5a12e9c60207', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '6b', 4, NOW(), NOW()),
  ('3daa4852-fb09-40f0-b786-1a71cad5b6b6', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '7a', 3, NOW(), NOW()),
  ('8e5b67d2-1e7c-40ad-aeb9-2007af695179', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '7b', 2, NOW(), NOW()),
  ('965769dc-628d-45d1-8243-923090dc60e7', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '8a', 1, NOW(), NOW()),
  ('57ce2bc2-3591-4cc6-9561-044afbf153f8', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '8b', 4, NOW(), NOW()),
  ('72cd97bf-0752-44dd-bb73-b794d4b4b1c9', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '9a', 3, NOW(), NOW()),
  ('218aa3a9-6950-41df-bb03-dd8be2190833', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '9b', 2, NOW(), NOW()),
  ('8a511dc6-21b8-49c5-9cfd-eaee1593f5ba', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '10a', 1, NOW(), NOW()),
  ('6fd41ba5-0482-47ac-bfa8-ec1869d3693b', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '10b', 4, NOW(), NOW()),
  ('efa45a78-a50e-4ff6-b8d9-ad78cc080e76', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '11a', 3, NOW(), NOW()),
  ('7575e95f-9b80-4d56-a3b3-a98f3faaec2b', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '11b', 2, NOW(), NOW()),
  ('31fb9838-a304-4377-960b-f30fba95ea32', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '12a', 1, NOW(), NOW()),
  ('659a7e00-1d79-4bce-a75c-c15fecbfd7ad', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '12b', 4, NOW(), NOW()),
  ('1f8b5d9a-8a69-408a-842c-cf6c317a6c21', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '13a', 3, NOW(), NOW()),
  ('232c3d5c-6a16-4bc3-8922-b18693898210', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '13b', 2, NOW(), NOW()),
  ('43396b5d-2c0b-44af-a3d4-113e16841c9e', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '14a', 1, NOW(), NOW()),
  ('0d01b328-b6c8-4548-8b3c-696023736728', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '14b', 4, NOW(), NOW()),
  ('4c9e77cb-2b77-49a8-a688-383db5a13f83', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '15a', 3, NOW(), NOW()),
  ('670c391a-411d-43c5-a74b-b5fa549575f3', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '15b', 2, NOW(), NOW()),
  ('a71c24cd-bb0f-46d3-a87f-950c1dd36f1e', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '16a', 1, NOW(), NOW()),
  ('1175c867-9dcb-49fe-adb9-86c768b67dd8', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '16b', 4, NOW(), NOW()),
  ('1938fbc7-ae9a-463f-ba84-f862f173d0bc', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '17a', 3, NOW(), NOW()),
  ('bd963656-196e-441b-96c0-c78785aff98a', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '17b', 2, NOW(), NOW()),
  ('045a5ec8-ddc2-4a08-82b1-2d5a0c6efc82', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '18a', 1, NOW(), NOW()),
  ('e8e50958-a205-4ba9-bd7c-ed0b95aaec33', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '18b', 4, NOW(), NOW()),
  ('bf449395-a4a7-452d-a42f-1a8fa343730f', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '19a', 3, NOW(), NOW()),
  ('c5a08499-c58d-4949-b1a6-f8664d7fe2cf', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '19b', 2, NOW(), NOW()),
  ('306692d0-f5b4-4638-aee1-91e32c82efb1', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '20a', 1, NOW(), NOW()),
  ('c0037dca-f64c-4c17-b1ac-fa4f8d095216', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '20b', 4, NOW(), NOW()),
  ('7e75e6b2-9403-4f4a-aedf-aefe9000675a', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '21a', 3, NOW(), NOW()),
  ('ec6b76cc-a71a-48d7-be36-bd60edee8bae', '8ca7d2dc-8e22-4c9b-b5d0-eb285b3b9678', '21b', 2, NOW(), NOW()),
  ('b60453af-deec-46e2-a044-2838ef6001ea', '4ed876f1-19da-44e8-b667-a9cae923cc15', '1a', 2, NOW(), NOW()),
  ('d142e10a-72e2-444c-bee1-e12cb8034b84', '4ed876f1-19da-44e8-b667-a9cae923cc15', '1b', null, NOW(), NOW()),
  ('4cecdb07-7c9d-409a-b7cf-75edcd310f72', '4ed876f1-19da-44e8-b667-a9cae923cc15', '2a', 4, NOW(), NOW()),
  ('d49f7bc2-b90f-483f-b11e-a6f6ac15463f', '4ed876f1-19da-44e8-b667-a9cae923cc15', '2b', 3, NOW(), NOW()),
  ('146be736-e58b-4235-968d-74ecaf7ed730', '4ed876f1-19da-44e8-b667-a9cae923cc15', '3a', 2, NOW(), NOW()),
  ('5d8a038d-f007-4c28-9087-b033ef808616', '4ed876f1-19da-44e8-b667-a9cae923cc15', '3b', null, NOW(), NOW()),
  ('97fd6462-6bc1-4ab0-a5c3-8ee843d6cec5', '4ed876f1-19da-44e8-b667-a9cae923cc15', '4a', 4, NOW(), NOW()),
  ('e4ba7eaf-428d-488c-9d54-917904fd099d', '4ed876f1-19da-44e8-b667-a9cae923cc15', '4b', 3, NOW(), NOW()),
  ('70e59de2-cbea-4216-99cc-b2f27cfbaa8d', '4ed876f1-19da-44e8-b667-a9cae923cc15', '5a', 2, NOW(), NOW()),
  ('f605a924-b1d7-4587-86c5-100ebde2116f', '4ed876f1-19da-44e8-b667-a9cae923cc15', '5b', null, NOW(), NOW()),
  ('40904f43-cb2f-4c1f-bdd5-f413aa9b3926', '4ed876f1-19da-44e8-b667-a9cae923cc15', '6a', 4, NOW(), NOW()),
  ('e6c316b4-528e-49e1-b877-7bedb129eaea', '4ed876f1-19da-44e8-b667-a9cae923cc15', '6b', 3, NOW(), NOW()),
  ('3c0d87c2-42ee-4e6f-9b9a-f744b8d680b7', '4ed876f1-19da-44e8-b667-a9cae923cc15', '7a', 2, NOW(), NOW()),
  ('2943b1e2-e3b0-4643-afe5-77ba937d00da', '4ed876f1-19da-44e8-b667-a9cae923cc15', '7b', null, NOW(), NOW()),
  ('55c77239-5c9d-4109-ac75-55dfe2013f00', '4ed876f1-19da-44e8-b667-a9cae923cc15', '8a', 4, NOW(), NOW()),
  ('7b16f1a5-47b4-4296-a79a-564fca2605bb', '4ed876f1-19da-44e8-b667-a9cae923cc15', '8b', 3, NOW(), NOW()),
  ('f9fc20cf-bdad-4a1e-89ad-36714e91f245', '4ed876f1-19da-44e8-b667-a9cae923cc15', '9a', 2, NOW(), NOW()),
  ('03615c5a-a827-44c5-9a59-dd6f3dca4a41', '4ed876f1-19da-44e8-b667-a9cae923cc15', '9b', null, NOW(), NOW()),
  ('b6143854-32b2-4d23-af32-2b4b3e8d4f2a', '4ed876f1-19da-44e8-b667-a9cae923cc15', '10a', 4, NOW(), NOW()),
  ('3e90468a-8114-42d2-af3c-ec012c963cb6', '4ed876f1-19da-44e8-b667-a9cae923cc15', '10b', 3, NOW(), NOW());

COMMIT;

-- ────────────────────────────────────────────────────────────────
-- Done.
--
-- Sample super admin login:
--   email:    admin
--   password: change-me-on-first-login
--
-- Sample cohort access code (share with respondents): YS2SYB
-- ────────────────────────────────────────────────────────────────
