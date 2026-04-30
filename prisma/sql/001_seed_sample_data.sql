-- Seed sample data for The Endurance Assessment (cohort-code model).
-- Run AFTER 000_initial_schema.sql.
-- Mirrors prisma/seed.ts. Idempotent for the assessment row; ON CONFLICT for the super admin.

BEGIN;

-- Super admin
INSERT INTO "Admin" ("id", "email", "passwordHash", "name", "role", "isActive", "createdAt", "updatedAt")
VALUES ('1819f112-850d-4515-871b-6fbaf5b80525', 'superadmin@forefront.example', '$2a$10$6kKdtP6uuGbtqRpkwkadZuWzel/tvT2Ap5M2q7oeBzh3.cUtDEtrK', 'Super Admin', 'super_admin', TRUE, NOW(), NOW())
ON CONFLICT ("email") DO UPDATE SET
  "role" = 'super_admin',
  "isActive" = TRUE,
  "name" = EXCLUDED."name",
  "passwordHash" = EXCLUDED."passwordHash",
  "updatedAt" = NOW();

-- Capture the super admin's id (newly inserted or pre-existing).
CREATE TEMP TABLE _seed_admin AS SELECT "id" FROM "Admin" WHERE "email" = 'superadmin@forefront.example';

-- Settings singleton
INSERT INTO "Settings" ("id", "aiProvider", "promptVersion", "updatedAt")
VALUES ('singleton', 'gemini', 1, NOW())
ON CONFLICT ("id") DO NOTHING;

-- Sample assessment "Acme Corp (sample)" — delete prior copy if any (cascades to children)
DELETE FROM "Assessment" WHERE "clientName" = 'Acme Corp (sample)';

INSERT INTO "Assessment" ("id", "clientName", "code", "maxUses", "status", "deadline", "createdById", "createdAt", "updatedAt")
SELECT '5b207477-047f-4c8e-b95a-191f0efdeb4f', 'Acme Corp (sample)', 'DYZDHE', 8, 'collecting', NOW() + INTERVAL '14 days', _seed_admin."id", NOW(), NOW()
FROM _seed_admin;

-- Departments
INSERT INTO "Department" ("id", "assessmentId", "name", "createdAt") VALUES
  ('cd50826f-58b8-4f40-9bbb-943f1e47310b', '5b207477-047f-4c8e-b95a-191f0efdeb4f', 'Sales',       NOW()),
  ('a8b7e14c-2715-40e1-9974-8a1c9d70c3d6',   '5b207477-047f-4c8e-b95a-191f0efdeb4f', 'Engineering', NOW());

-- Respondents (5 sample rows: 3 submitted, 1 in-progress, 1 fresh-no-answers)
INSERT INTO "Respondent" ("id", "assessmentId", "name", "departmentId", "level", "tenure", "startedAt", "submittedAt", "createdAt", "updatedAt") VALUES
  ('1da481fb-3710-457e-bf04-1cc29eb97bd5', '5b207477-047f-4c8e-b95a-191f0efdeb4f', 'Avery R.', 'cd50826f-58b8-4f40-9bbb-943f1e47310b', 'manager', 'y4_7', NOW(), NOW(), NOW(), NOW()),
  ('c2aed8f3-5414-4a7d-a67e-dfcf1db8217e', '5b207477-047f-4c8e-b95a-191f0efdeb4f', 'Blake S.', 'cd50826f-58b8-4f40-9bbb-943f1e47310b', 'senior_leader', 'y8_15', NOW(), NOW(), NOW(), NOW()),
  ('d5f94d86-8451-4960-8a4e-12c272292e6f', '5b207477-047f-4c8e-b95a-191f0efdeb4f', 'Casey T.', 'a8b7e14c-2715-40e1-9974-8a1c9d70c3d6', 'executive', 'gt_15y', NOW(), NOW(), NOW(), NOW()),
  ('995bebbf-de21-4646-a1a8-d11bd0d1732c', '5b207477-047f-4c8e-b95a-191f0efdeb4f', 'Drew V.', 'a8b7e14c-2715-40e1-9974-8a1c9d70c3d6', 'team_lead', 'y1_3', NOW(), NULL, NOW(), NOW()),
  ('e5708729-09bc-4a91-b822-df37b472a9c5', '5b207477-047f-4c8e-b95a-191f0efdeb4f', NULL, 'a8b7e14c-2715-40e1-9974-8a1c9d70c3d6', 'individual_contributor', 'lt_1y', NOW(), NULL, NOW(), NOW());

-- Responses (submitted respondents have all 30; #4 has 14 of 30; #5 has zero).
-- value=NULL means "I don't know" (a deliberate non-answer).
INSERT INTO "Response" ("id", "respondentId", "questionId", "value", "createdAt", "updatedAt") VALUES
  ('3152164c-97c8-4af2-a313-eb4fa381622a', '1da481fb-3710-457e-bf04-1cc29eb97bd5', '1a', null, NOW(), NOW()),
  ('454ab688-ef5b-481d-8899-22c68c10d6de', '1da481fb-3710-457e-bf04-1cc29eb97bd5', '1b', 4, NOW(), NOW()),
  ('ea227105-5880-46c7-8c2d-4ef36e3f0b3f', '1da481fb-3710-457e-bf04-1cc29eb97bd5', '2a', 3, NOW(), NOW()),
  ('f8eaafa1-b189-4197-a4be-5ab95db32914', '1da481fb-3710-457e-bf04-1cc29eb97bd5', '2b', 2, NOW(), NOW()),
  ('b645fa43-9f6d-449e-b50c-e9bf606e85b1', '1da481fb-3710-457e-bf04-1cc29eb97bd5', '3a', null, NOW(), NOW()),
  ('67e789b7-e4f1-45a4-8d98-7d2957692c1a', '1da481fb-3710-457e-bf04-1cc29eb97bd5', '3b', 4, NOW(), NOW()),
  ('9c2694da-1354-4fd3-b608-3b9dfa03045a', '1da481fb-3710-457e-bf04-1cc29eb97bd5', '4a', 3, NOW(), NOW()),
  ('2ec53db1-52ef-49ee-80a3-25ed463bf108', '1da481fb-3710-457e-bf04-1cc29eb97bd5', '4b', 2, NOW(), NOW()),
  ('c01d4c51-79a4-4b45-a0cb-0cd4a4d5a3c8', '1da481fb-3710-457e-bf04-1cc29eb97bd5', '5a', null, NOW(), NOW()),
  ('4f138cec-84db-41b2-85c5-958077e9aa9d', '1da481fb-3710-457e-bf04-1cc29eb97bd5', '5b', 4, NOW(), NOW()),
  ('9f25a89b-1e76-4525-af6a-deefe230c30e', '1da481fb-3710-457e-bf04-1cc29eb97bd5', '6a', 3, NOW(), NOW()),
  ('8c0b7841-71f3-407b-8038-23320f339194', '1da481fb-3710-457e-bf04-1cc29eb97bd5', '6b', 2, NOW(), NOW()),
  ('3440f096-c101-4a06-85dc-aaf244169c73', '1da481fb-3710-457e-bf04-1cc29eb97bd5', '7a', null, NOW(), NOW()),
  ('9cf1994a-a89f-432b-9ea1-5c1e1a3817b6', '1da481fb-3710-457e-bf04-1cc29eb97bd5', '7b', 4, NOW(), NOW()),
  ('e87dccfe-811f-4757-99cf-b8438c9c5660', '1da481fb-3710-457e-bf04-1cc29eb97bd5', '8a', 3, NOW(), NOW()),
  ('e560d216-7e5d-42f8-b86e-82c300a1a162', '1da481fb-3710-457e-bf04-1cc29eb97bd5', '8b', 2, NOW(), NOW()),
  ('2e4e3893-b237-46d8-8082-312a910791b0', '1da481fb-3710-457e-bf04-1cc29eb97bd5', '9a', null, NOW(), NOW()),
  ('7cb7c3a2-764d-4fa6-9dfc-65dec623beb9', '1da481fb-3710-457e-bf04-1cc29eb97bd5', '9b', 4, NOW(), NOW()),
  ('33ac2098-8dcc-464a-8385-9979315500ec', '1da481fb-3710-457e-bf04-1cc29eb97bd5', '10a', 3, NOW(), NOW()),
  ('af0ad380-2596-4808-bf76-5cbbbe9856c5', '1da481fb-3710-457e-bf04-1cc29eb97bd5', '10b', 2, NOW(), NOW()),
  ('e9d4d0de-fef2-43d0-899c-96602fcb50be', '1da481fb-3710-457e-bf04-1cc29eb97bd5', '11a', null, NOW(), NOW()),
  ('063ebb7f-e728-4a04-a816-4cb15abaf669', '1da481fb-3710-457e-bf04-1cc29eb97bd5', '11b', 4, NOW(), NOW()),
  ('f314cbf5-3593-4d52-becc-3ba8ef627549', '1da481fb-3710-457e-bf04-1cc29eb97bd5', '12a', 3, NOW(), NOW()),
  ('c8827a74-5bbb-4917-bb5c-16d2692a6e56', '1da481fb-3710-457e-bf04-1cc29eb97bd5', '12b', 2, NOW(), NOW()),
  ('a0d8d1bc-a39c-4977-960b-9347f61990b4', '1da481fb-3710-457e-bf04-1cc29eb97bd5', '13a', null, NOW(), NOW()),
  ('e4b75fd3-7ef3-4da9-bfbf-e422cc8d559c', '1da481fb-3710-457e-bf04-1cc29eb97bd5', '13b', 4, NOW(), NOW()),
  ('942b3726-220f-441f-bb45-634afaa6b114', '1da481fb-3710-457e-bf04-1cc29eb97bd5', '14a', 3, NOW(), NOW()),
  ('911d447e-c2d6-4bea-b63b-deaea32df482', '1da481fb-3710-457e-bf04-1cc29eb97bd5', '14b', 2, NOW(), NOW()),
  ('f7f47790-a094-4895-ba7f-dad7724d5f54', '1da481fb-3710-457e-bf04-1cc29eb97bd5', '15a', null, NOW(), NOW()),
  ('2224591a-701b-4351-95b8-3e3f0c88e15f', '1da481fb-3710-457e-bf04-1cc29eb97bd5', '15b', 4, NOW(), NOW()),
  ('a905bfd8-6065-4d2a-b704-c1bd6cbf74bc', 'c2aed8f3-5414-4a7d-a67e-dfcf1db8217e', '1a', 4, NOW(), NOW()),
  ('d31e2407-0c70-481a-9310-5e0bae286c0f', 'c2aed8f3-5414-4a7d-a67e-dfcf1db8217e', '1b', 3, NOW(), NOW()),
  ('4f228df4-3069-450c-b470-80b16ad3018b', 'c2aed8f3-5414-4a7d-a67e-dfcf1db8217e', '2a', 2, NOW(), NOW()),
  ('c4df88b0-2c44-4c3d-ac14-3f2ea18f2b83', 'c2aed8f3-5414-4a7d-a67e-dfcf1db8217e', '2b', 1, NOW(), NOW()),
  ('7ce50010-ab35-408a-8ce9-d9835b6052f4', 'c2aed8f3-5414-4a7d-a67e-dfcf1db8217e', '3a', 4, NOW(), NOW()),
  ('a30f2598-bd66-4f12-b56e-46dfa80e4620', 'c2aed8f3-5414-4a7d-a67e-dfcf1db8217e', '3b', 3, NOW(), NOW()),
  ('9f37811b-c693-4c94-93f0-ca8652b36b53', 'c2aed8f3-5414-4a7d-a67e-dfcf1db8217e', '4a', 2, NOW(), NOW()),
  ('bddd6c8b-6583-4aeb-9de2-fd71355613cf', 'c2aed8f3-5414-4a7d-a67e-dfcf1db8217e', '4b', 1, NOW(), NOW()),
  ('ac066ed5-fa57-4f5d-af36-51005439ec69', 'c2aed8f3-5414-4a7d-a67e-dfcf1db8217e', '5a', 4, NOW(), NOW()),
  ('fbda96ff-8a6b-4675-910a-4b5f2af42da9', 'c2aed8f3-5414-4a7d-a67e-dfcf1db8217e', '5b', 3, NOW(), NOW()),
  ('33a670ae-e7de-46a2-bf75-088489d122e3', 'c2aed8f3-5414-4a7d-a67e-dfcf1db8217e', '6a', 2, NOW(), NOW()),
  ('138dfa35-7639-4679-8ae7-b7d3a92a934e', 'c2aed8f3-5414-4a7d-a67e-dfcf1db8217e', '6b', 1, NOW(), NOW()),
  ('b2ece8a0-657d-4de8-8cde-76a4aa937623', 'c2aed8f3-5414-4a7d-a67e-dfcf1db8217e', '7a', 4, NOW(), NOW()),
  ('a70226c2-486e-4155-a956-76cc49770e3b', 'c2aed8f3-5414-4a7d-a67e-dfcf1db8217e', '7b', 3, NOW(), NOW()),
  ('af1c13d0-9ed2-4fd3-aaaf-34b8d91762a6', 'c2aed8f3-5414-4a7d-a67e-dfcf1db8217e', '8a', 2, NOW(), NOW()),
  ('da1f0df0-d25c-4106-82f6-956bb651dbb5', 'c2aed8f3-5414-4a7d-a67e-dfcf1db8217e', '8b', 1, NOW(), NOW()),
  ('2a8d33a0-1d35-4dff-9313-6cddac1dbe91', 'c2aed8f3-5414-4a7d-a67e-dfcf1db8217e', '9a', 4, NOW(), NOW()),
  ('bc56ede3-1fea-4543-99c6-a8bdd21fe254', 'c2aed8f3-5414-4a7d-a67e-dfcf1db8217e', '9b', 3, NOW(), NOW()),
  ('9efeaf80-29a3-474c-9885-96e6d63a1a15', 'c2aed8f3-5414-4a7d-a67e-dfcf1db8217e', '10a', 2, NOW(), NOW()),
  ('3e7c5774-5ea5-4af3-b109-ba2752be6a09', 'c2aed8f3-5414-4a7d-a67e-dfcf1db8217e', '10b', 1, NOW(), NOW()),
  ('d06ad44f-0c59-46bc-a00e-361d75a41b6f', 'c2aed8f3-5414-4a7d-a67e-dfcf1db8217e', '11a', 4, NOW(), NOW()),
  ('bf7c32a3-57e8-4bc6-b9eb-d1f41a7ad2b6', 'c2aed8f3-5414-4a7d-a67e-dfcf1db8217e', '11b', 3, NOW(), NOW()),
  ('5e7064fd-3e3e-48f2-ac6e-8d5cc6a8d4cf', 'c2aed8f3-5414-4a7d-a67e-dfcf1db8217e', '12a', 2, NOW(), NOW()),
  ('33d94179-df2b-452e-a571-cf2736a78d79', 'c2aed8f3-5414-4a7d-a67e-dfcf1db8217e', '12b', 1, NOW(), NOW()),
  ('d75e5e8a-09b4-4787-84d9-88883d15a057', 'c2aed8f3-5414-4a7d-a67e-dfcf1db8217e', '13a', 4, NOW(), NOW()),
  ('fbe00cb9-6bfc-4642-9379-35b481bda880', 'c2aed8f3-5414-4a7d-a67e-dfcf1db8217e', '13b', 3, NOW(), NOW()),
  ('3efc6a4a-bd13-4b99-9fc9-5f3994b60722', 'c2aed8f3-5414-4a7d-a67e-dfcf1db8217e', '14a', 2, NOW(), NOW()),
  ('b1e6b4cf-47b8-4467-bab8-8203193fd32b', 'c2aed8f3-5414-4a7d-a67e-dfcf1db8217e', '14b', 1, NOW(), NOW()),
  ('ba7fea6e-0aaa-473b-acf5-ede167700568', 'c2aed8f3-5414-4a7d-a67e-dfcf1db8217e', '15a', 4, NOW(), NOW()),
  ('ce33eb29-8629-482b-95fc-88edd09987fd', 'c2aed8f3-5414-4a7d-a67e-dfcf1db8217e', '15b', 3, NOW(), NOW()),
  ('3a2a7432-059a-4aa0-9e91-4c1e9259124e', 'd5f94d86-8451-4960-8a4e-12c272292e6f', '1a', 3, NOW(), NOW()),
  ('8abc63a8-a10e-432e-b077-cf6cc7da3b16', 'd5f94d86-8451-4960-8a4e-12c272292e6f', '1b', 2, NOW(), NOW()),
  ('529b5014-ec89-4ed0-9d7b-bc316ee0e3f1', 'd5f94d86-8451-4960-8a4e-12c272292e6f', '2a', 1, NOW(), NOW()),
  ('ab59da49-233b-4545-8362-38ec9c811503', 'd5f94d86-8451-4960-8a4e-12c272292e6f', '2b', 4, NOW(), NOW()),
  ('3b6d98d0-72ba-432c-b1b1-c8c197388da1', 'd5f94d86-8451-4960-8a4e-12c272292e6f', '3a', 3, NOW(), NOW()),
  ('819239ff-89c3-4d3b-92ef-2b3a65bc72f9', 'd5f94d86-8451-4960-8a4e-12c272292e6f', '3b', 2, NOW(), NOW()),
  ('d638e2fd-17d5-49dc-836e-4f4b55eea0fa', 'd5f94d86-8451-4960-8a4e-12c272292e6f', '4a', 1, NOW(), NOW()),
  ('f7ea84c2-c66d-4d8d-b9af-5309868cdca2', 'd5f94d86-8451-4960-8a4e-12c272292e6f', '4b', 4, NOW(), NOW()),
  ('3e1e0cb1-6d81-415f-bea5-fc4b2129cdf8', 'd5f94d86-8451-4960-8a4e-12c272292e6f', '5a', 3, NOW(), NOW()),
  ('b5c25830-03e9-4b57-a539-46246fe1537c', 'd5f94d86-8451-4960-8a4e-12c272292e6f', '5b', 2, NOW(), NOW()),
  ('4f95d4fd-364c-4b53-b0a2-4c81c76398fc', 'd5f94d86-8451-4960-8a4e-12c272292e6f', '6a', 1, NOW(), NOW()),
  ('ae545137-3678-4cf9-91db-9154ceaf7301', 'd5f94d86-8451-4960-8a4e-12c272292e6f', '6b', 4, NOW(), NOW()),
  ('9e33fbf2-6af6-492c-b4f6-643e4bb80a22', 'd5f94d86-8451-4960-8a4e-12c272292e6f', '7a', 3, NOW(), NOW()),
  ('56835969-5091-4708-8574-82645554cd0c', 'd5f94d86-8451-4960-8a4e-12c272292e6f', '7b', 2, NOW(), NOW()),
  ('4fb5bc84-bc41-4fd6-bb44-baa10bc18edd', 'd5f94d86-8451-4960-8a4e-12c272292e6f', '8a', 1, NOW(), NOW()),
  ('856daba0-d199-4ec8-bbef-690cbc099fd5', 'd5f94d86-8451-4960-8a4e-12c272292e6f', '8b', 4, NOW(), NOW()),
  ('eb40f702-09a6-4388-90bc-001c6caa78a7', 'd5f94d86-8451-4960-8a4e-12c272292e6f', '9a', 3, NOW(), NOW()),
  ('1ec956fe-56d7-41dd-b3de-403eb7c4fefa', 'd5f94d86-8451-4960-8a4e-12c272292e6f', '9b', 2, NOW(), NOW()),
  ('e95ed9ed-bc87-4c65-97fb-9752e31c990d', 'd5f94d86-8451-4960-8a4e-12c272292e6f', '10a', 1, NOW(), NOW()),
  ('4dbfac79-bb24-4643-8088-75df1fb57044', 'd5f94d86-8451-4960-8a4e-12c272292e6f', '10b', 4, NOW(), NOW()),
  ('9756a245-222a-43ed-a790-925827ac8036', 'd5f94d86-8451-4960-8a4e-12c272292e6f', '11a', 3, NOW(), NOW()),
  ('922364df-ac38-47e2-9204-0d6240eae288', 'd5f94d86-8451-4960-8a4e-12c272292e6f', '11b', 2, NOW(), NOW()),
  ('809610bc-6849-46a4-aa60-e9d3da232b90', 'd5f94d86-8451-4960-8a4e-12c272292e6f', '12a', 1, NOW(), NOW()),
  ('922f8276-0614-472f-b71f-23b01307e006', 'd5f94d86-8451-4960-8a4e-12c272292e6f', '12b', 4, NOW(), NOW()),
  ('29b68d45-d374-4136-a4ed-b1bae22c0d1a', 'd5f94d86-8451-4960-8a4e-12c272292e6f', '13a', 3, NOW(), NOW()),
  ('fe4a4423-8e02-42c6-8062-70b62b601f56', 'd5f94d86-8451-4960-8a4e-12c272292e6f', '13b', 2, NOW(), NOW()),
  ('a83b4297-1503-4b0a-b2ec-81a42215db3b', 'd5f94d86-8451-4960-8a4e-12c272292e6f', '14a', 1, NOW(), NOW()),
  ('b09712cc-fb6d-4876-bbc7-56202f60719b', 'd5f94d86-8451-4960-8a4e-12c272292e6f', '14b', 4, NOW(), NOW()),
  ('0c2ddb65-941f-4e15-98a7-78045332b58e', 'd5f94d86-8451-4960-8a4e-12c272292e6f', '15a', 3, NOW(), NOW()),
  ('4ea101bc-73e2-4aea-880a-6c9b846e3d87', 'd5f94d86-8451-4960-8a4e-12c272292e6f', '15b', 2, NOW(), NOW()),
  ('7bfd1ec0-21ec-4208-bf22-b357d86e87d3', '995bebbf-de21-4646-a1a8-d11bd0d1732c', '1a', 2, NOW(), NOW()),
  ('1abb2ba4-e929-4480-b9e1-2808f4deb309', '995bebbf-de21-4646-a1a8-d11bd0d1732c', '1b', null, NOW(), NOW()),
  ('d28b5470-2bc9-4139-969b-3dec33f7f4e5', '995bebbf-de21-4646-a1a8-d11bd0d1732c', '2a', 4, NOW(), NOW()),
  ('4c1e13da-f03c-4cd8-95dc-eb3a7b310959', '995bebbf-de21-4646-a1a8-d11bd0d1732c', '2b', 3, NOW(), NOW()),
  ('1155f424-a4bd-475f-a4f1-616f2466e361', '995bebbf-de21-4646-a1a8-d11bd0d1732c', '3a', 2, NOW(), NOW()),
  ('9936d06b-02c7-4fbe-bd19-2315ac18ad0d', '995bebbf-de21-4646-a1a8-d11bd0d1732c', '3b', null, NOW(), NOW()),
  ('fef70156-0fc8-4cab-bee0-9cb457a25e7d', '995bebbf-de21-4646-a1a8-d11bd0d1732c', '4a', 4, NOW(), NOW()),
  ('9d5e35e2-8a21-4f58-9522-777bf06b05f2', '995bebbf-de21-4646-a1a8-d11bd0d1732c', '4b', 3, NOW(), NOW()),
  ('46e32ba4-ef7f-438e-9d52-fa09f32814e1', '995bebbf-de21-4646-a1a8-d11bd0d1732c', '5a', 2, NOW(), NOW()),
  ('1a5de906-2e86-4b59-9bfa-6ebb9738aae9', '995bebbf-de21-4646-a1a8-d11bd0d1732c', '5b', null, NOW(), NOW()),
  ('a72ac83c-97af-41af-b59e-adcb619e5091', '995bebbf-de21-4646-a1a8-d11bd0d1732c', '6a', 4, NOW(), NOW()),
  ('a5b42041-e130-4ef2-82f4-d3cd2a0f5845', '995bebbf-de21-4646-a1a8-d11bd0d1732c', '6b', 3, NOW(), NOW()),
  ('5338ae6c-3fe9-4bbe-a769-2b55410effb7', '995bebbf-de21-4646-a1a8-d11bd0d1732c', '7a', 2, NOW(), NOW()),
  ('c210550e-5ca1-4c8e-94e9-d39a32391758', '995bebbf-de21-4646-a1a8-d11bd0d1732c', '7b', null, NOW(), NOW());

COMMIT;

-- ────────────────────────────────────────────────────────────────
-- Done.
--
-- Sample super admin login:
--   email:    superadmin@forefront.example
--   password: change-me-on-first-login
--
-- Sample cohort access code (share with respondents): DYZDHE
-- ────────────────────────────────────────────────────────────────
