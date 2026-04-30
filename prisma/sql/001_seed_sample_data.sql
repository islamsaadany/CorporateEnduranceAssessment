-- Seed sample data for The Endurance Assessment (cohort-code model).
-- Run AFTER 000_initial_schema.sql.
-- Mirrors prisma/seed.ts. Idempotent for the assessment row; ON CONFLICT for the super admin.

BEGIN;

-- Super admin
INSERT INTO "Admin" ("id", "email", "passwordHash", "name", "role", "isActive", "createdAt", "updatedAt")
VALUES ('6d1572c3-132e-45b4-afa8-37640510c0c8', 'superadmin@forefront.example', '$2a$10$bYjtTW4g10t1bLXQxi6GVOz4/65boWalcd1OItR.2ouylv66h2fsC', 'Super Admin', 'super_admin', TRUE, NOW(), NOW())
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
SELECT '658f14d3-dfcb-4a1a-bd8e-628021c06262', 'Acme Corp (sample)', 'SAGJCA', 8, 'collecting', NOW() + INTERVAL '14 days', _seed_admin."id", NOW(), NOW()
FROM _seed_admin;

-- Departments
INSERT INTO "Department" ("id", "assessmentId", "name", "createdAt") VALUES
  ('d0b2760c-7032-48b2-8c91-7d1c2dccc5bf', '658f14d3-dfcb-4a1a-bd8e-628021c06262', 'Sales',       NOW()),
  ('4686502a-53eb-4237-8164-77ba2f63e063',   '658f14d3-dfcb-4a1a-bd8e-628021c06262', 'Engineering', NOW());

-- Respondents (5 sample rows: 3 submitted, 1 in-progress, 1 fresh-no-answers).
-- All have demographicsCompletedAt set so they show up in the admin table.
INSERT INTO "Respondent" ("id", "assessmentId", "name", "departmentId", "level", "tenure", "demographicsCompletedAt", "startedAt", "submittedAt", "createdAt", "updatedAt") VALUES
  ('caa4bfe5-8ecb-4826-a90b-1ad4c6821318', '658f14d3-dfcb-4a1a-bd8e-628021c06262', 'Avery R.', 'd0b2760c-7032-48b2-8c91-7d1c2dccc5bf', 'manager', 'y4_7', NOW(), NOW(), NOW(), NOW(), NOW()),
  ('dabf4375-eafc-417f-ae7a-87910d0210bc', '658f14d3-dfcb-4a1a-bd8e-628021c06262', 'Blake S.', 'd0b2760c-7032-48b2-8c91-7d1c2dccc5bf', 'senior_leader', 'y8_15', NOW(), NOW(), NOW(), NOW(), NOW()),
  ('a89a46c5-eacb-4a5d-9cd0-1e9533bc2798', '658f14d3-dfcb-4a1a-bd8e-628021c06262', 'Casey T.', '4686502a-53eb-4237-8164-77ba2f63e063', 'senior_leader', 'gt_15y', NOW(), NOW(), NOW(), NOW(), NOW()),
  ('968f1cac-0e08-4d4b-b75d-7a9b7f06e440', '658f14d3-dfcb-4a1a-bd8e-628021c06262', 'Drew V.', '4686502a-53eb-4237-8164-77ba2f63e063', 'team_leader', 'y1_3', NOW(), NOW(), NULL, NOW(), NOW()),
  ('718806fc-fe67-4b86-883e-01d50aff895e', '658f14d3-dfcb-4a1a-bd8e-628021c06262', 'Eli W.', '4686502a-53eb-4237-8164-77ba2f63e063', 'individual_contributor', 'lt_1y', NOW(), NOW(), NULL, NOW(), NOW());

-- Responses (submitted respondents have all 30; #4 has 14 of 30; #5 has zero).
-- value=NULL means "I don't know" (a deliberate non-answer).
INSERT INTO "Response" ("id", "respondentId", "questionId", "value", "createdAt", "updatedAt") VALUES
  ('65e64cb0-c1e8-4397-a7f3-1e5b3b757120', 'caa4bfe5-8ecb-4826-a90b-1ad4c6821318', '1a', null, NOW(), NOW()),
  ('da2d6fe2-0b18-41a7-bc92-c895e01ccb8d', 'caa4bfe5-8ecb-4826-a90b-1ad4c6821318', '1b', 4, NOW(), NOW()),
  ('bfc42c77-2eb4-4837-b4b0-7b265daf892a', 'caa4bfe5-8ecb-4826-a90b-1ad4c6821318', '2a', 3, NOW(), NOW()),
  ('6fc0e266-c662-4fb1-a0a2-39b6264171b2', 'caa4bfe5-8ecb-4826-a90b-1ad4c6821318', '2b', 2, NOW(), NOW()),
  ('b97a0bd1-b554-4ac6-a880-32c599084363', 'caa4bfe5-8ecb-4826-a90b-1ad4c6821318', '3a', null, NOW(), NOW()),
  ('692a0417-ba08-48b8-be9f-b44c0e046ed5', 'caa4bfe5-8ecb-4826-a90b-1ad4c6821318', '3b', 4, NOW(), NOW()),
  ('da11a3f7-18a2-402a-8dd2-14da144af21a', 'caa4bfe5-8ecb-4826-a90b-1ad4c6821318', '4a', 3, NOW(), NOW()),
  ('4cc92a2f-bbbd-4db0-9f29-df903a1c6406', 'caa4bfe5-8ecb-4826-a90b-1ad4c6821318', '4b', 2, NOW(), NOW()),
  ('f9e4dce7-eb3a-402a-9a75-64f54865d1c4', 'caa4bfe5-8ecb-4826-a90b-1ad4c6821318', '5a', null, NOW(), NOW()),
  ('8c23bf6e-e2b4-43bd-ae20-a4f40ca6d683', 'caa4bfe5-8ecb-4826-a90b-1ad4c6821318', '5b', 4, NOW(), NOW()),
  ('4b410841-efc6-4f90-9900-b89896b95cca', 'caa4bfe5-8ecb-4826-a90b-1ad4c6821318', '6a', 3, NOW(), NOW()),
  ('886e98f7-9420-482b-ba81-a891216dc003', 'caa4bfe5-8ecb-4826-a90b-1ad4c6821318', '6b', 2, NOW(), NOW()),
  ('72c45525-80c7-4735-9917-4bc82eb9cf10', 'caa4bfe5-8ecb-4826-a90b-1ad4c6821318', '7a', null, NOW(), NOW()),
  ('55fe01fd-3e4a-405c-86c5-594bb1dbb5d6', 'caa4bfe5-8ecb-4826-a90b-1ad4c6821318', '7b', 4, NOW(), NOW()),
  ('b7f766e3-e476-4aa5-8a8e-751283e24934', 'caa4bfe5-8ecb-4826-a90b-1ad4c6821318', '8a', 3, NOW(), NOW()),
  ('86ec492a-029c-45ff-8800-e032e8ee3de9', 'caa4bfe5-8ecb-4826-a90b-1ad4c6821318', '8b', 2, NOW(), NOW()),
  ('285bb751-17fe-497c-b90d-fa61afd3ecd3', 'caa4bfe5-8ecb-4826-a90b-1ad4c6821318', '9a', null, NOW(), NOW()),
  ('db33660e-583d-4dec-8b88-0cb817367ef9', 'caa4bfe5-8ecb-4826-a90b-1ad4c6821318', '9b', 4, NOW(), NOW()),
  ('6cbe6207-b980-4ae3-9d5c-3e758a339934', 'caa4bfe5-8ecb-4826-a90b-1ad4c6821318', '10a', 3, NOW(), NOW()),
  ('3c8d8104-5f8e-48ff-b5eb-e36570528911', 'caa4bfe5-8ecb-4826-a90b-1ad4c6821318', '10b', 2, NOW(), NOW()),
  ('d26ac36d-9d3e-4b14-adf5-ce4419fbde22', 'caa4bfe5-8ecb-4826-a90b-1ad4c6821318', '11a', null, NOW(), NOW()),
  ('6289abc3-9d40-4022-8393-b1c7b54731d1', 'caa4bfe5-8ecb-4826-a90b-1ad4c6821318', '11b', 4, NOW(), NOW()),
  ('da38b4b7-bdd9-4ba2-83f3-2dc826fa659e', 'caa4bfe5-8ecb-4826-a90b-1ad4c6821318', '12a', 3, NOW(), NOW()),
  ('b46afe93-19f4-40b4-a65a-69f1b4532fac', 'caa4bfe5-8ecb-4826-a90b-1ad4c6821318', '12b', 2, NOW(), NOW()),
  ('1cd82d16-377e-4e9c-b696-ea01aa54158d', 'caa4bfe5-8ecb-4826-a90b-1ad4c6821318', '13a', null, NOW(), NOW()),
  ('dfe37758-7945-4fde-b2a9-63c5f181d324', 'caa4bfe5-8ecb-4826-a90b-1ad4c6821318', '13b', 4, NOW(), NOW()),
  ('a8b654ea-cfce-4b63-822f-9621e4c16d60', 'caa4bfe5-8ecb-4826-a90b-1ad4c6821318', '14a', 3, NOW(), NOW()),
  ('00c8205f-98f7-4555-a0e5-416ad97fd11b', 'caa4bfe5-8ecb-4826-a90b-1ad4c6821318', '14b', 2, NOW(), NOW()),
  ('070e2ec8-2d8e-43fb-90fa-d7b84ed54983', 'caa4bfe5-8ecb-4826-a90b-1ad4c6821318', '15a', null, NOW(), NOW()),
  ('4fcf5f45-9f3e-4869-ae17-37045930d06c', 'caa4bfe5-8ecb-4826-a90b-1ad4c6821318', '15b', 4, NOW(), NOW()),
  ('6072f6a8-dde2-4e19-b1b7-fad505bf3dee', 'dabf4375-eafc-417f-ae7a-87910d0210bc', '1a', 4, NOW(), NOW()),
  ('9b89ae11-04c2-4563-96d4-3a0daeba6a27', 'dabf4375-eafc-417f-ae7a-87910d0210bc', '1b', 3, NOW(), NOW()),
  ('97e4afbd-19f5-4616-b82c-79e290794bd9', 'dabf4375-eafc-417f-ae7a-87910d0210bc', '2a', 2, NOW(), NOW()),
  ('06421817-6f90-429c-9b2f-2c92e711a811', 'dabf4375-eafc-417f-ae7a-87910d0210bc', '2b', 1, NOW(), NOW()),
  ('d95a6fb7-ba0d-4331-a814-844ac4cd1368', 'dabf4375-eafc-417f-ae7a-87910d0210bc', '3a', 4, NOW(), NOW()),
  ('0f5e42dc-9caa-4d8c-ba4a-039a953a1de7', 'dabf4375-eafc-417f-ae7a-87910d0210bc', '3b', 3, NOW(), NOW()),
  ('bc8a3616-2581-4641-a16e-6e0fc89f4ad4', 'dabf4375-eafc-417f-ae7a-87910d0210bc', '4a', 2, NOW(), NOW()),
  ('0b22b689-b050-405d-aaa1-f3366382fc37', 'dabf4375-eafc-417f-ae7a-87910d0210bc', '4b', 1, NOW(), NOW()),
  ('98c26902-9de6-4b96-8b0a-cb898e5cadfe', 'dabf4375-eafc-417f-ae7a-87910d0210bc', '5a', 4, NOW(), NOW()),
  ('c6326a12-64f7-4226-bce3-f46cd4a7050e', 'dabf4375-eafc-417f-ae7a-87910d0210bc', '5b', 3, NOW(), NOW()),
  ('af4ba006-89f8-4bf4-9a97-01054ec1016d', 'dabf4375-eafc-417f-ae7a-87910d0210bc', '6a', 2, NOW(), NOW()),
  ('452edca6-a110-4715-97e1-85c8093093b5', 'dabf4375-eafc-417f-ae7a-87910d0210bc', '6b', 1, NOW(), NOW()),
  ('91818711-7cbb-46c6-b7e1-a24d739abaad', 'dabf4375-eafc-417f-ae7a-87910d0210bc', '7a', 4, NOW(), NOW()),
  ('5c76c548-9b3b-450a-b5ac-64b24a9ca0c1', 'dabf4375-eafc-417f-ae7a-87910d0210bc', '7b', 3, NOW(), NOW()),
  ('053bd8d6-fff4-4722-be0e-9fa02547e778', 'dabf4375-eafc-417f-ae7a-87910d0210bc', '8a', 2, NOW(), NOW()),
  ('547f35b1-8828-4332-8d64-d0a3eee84fc6', 'dabf4375-eafc-417f-ae7a-87910d0210bc', '8b', 1, NOW(), NOW()),
  ('cdbd5752-a8a8-422a-90be-39c418c25077', 'dabf4375-eafc-417f-ae7a-87910d0210bc', '9a', 4, NOW(), NOW()),
  ('f9701576-045d-4734-89d3-8968425e1695', 'dabf4375-eafc-417f-ae7a-87910d0210bc', '9b', 3, NOW(), NOW()),
  ('b59ea296-8eb4-4549-a898-58e2adacf90b', 'dabf4375-eafc-417f-ae7a-87910d0210bc', '10a', 2, NOW(), NOW()),
  ('c8c90769-fad1-4dda-a12e-406579731fa9', 'dabf4375-eafc-417f-ae7a-87910d0210bc', '10b', 1, NOW(), NOW()),
  ('07cb7a73-92cc-498a-b756-5bc19f8bb211', 'dabf4375-eafc-417f-ae7a-87910d0210bc', '11a', 4, NOW(), NOW()),
  ('6b657316-140e-419f-af3f-a1719b21d167', 'dabf4375-eafc-417f-ae7a-87910d0210bc', '11b', 3, NOW(), NOW()),
  ('d8859ff2-8aa1-4ab9-ac13-1c59b21a7ae0', 'dabf4375-eafc-417f-ae7a-87910d0210bc', '12a', 2, NOW(), NOW()),
  ('c0778a7f-82fe-4018-8e9b-a3648b56bfd5', 'dabf4375-eafc-417f-ae7a-87910d0210bc', '12b', 1, NOW(), NOW()),
  ('8f32a2bf-e7e1-436f-a212-7eef61a9bad4', 'dabf4375-eafc-417f-ae7a-87910d0210bc', '13a', 4, NOW(), NOW()),
  ('149202be-489a-464c-9eca-779475706b0c', 'dabf4375-eafc-417f-ae7a-87910d0210bc', '13b', 3, NOW(), NOW()),
  ('5a1bf953-2db1-4197-8380-5544b7e179b1', 'dabf4375-eafc-417f-ae7a-87910d0210bc', '14a', 2, NOW(), NOW()),
  ('7ad7fe6a-3673-42f1-990a-cbb404161052', 'dabf4375-eafc-417f-ae7a-87910d0210bc', '14b', 1, NOW(), NOW()),
  ('5a0c2db1-57bd-4191-a75b-6cbe2120d05c', 'dabf4375-eafc-417f-ae7a-87910d0210bc', '15a', 4, NOW(), NOW()),
  ('975ea6f6-6bf8-47e2-9aa4-2ea443628847', 'dabf4375-eafc-417f-ae7a-87910d0210bc', '15b', 3, NOW(), NOW()),
  ('f69ebbcc-1ecc-4f22-9dfb-615b5f2be3d6', 'a89a46c5-eacb-4a5d-9cd0-1e9533bc2798', '1a', 3, NOW(), NOW()),
  ('8465e75e-b6c1-4733-830b-42f7ae17b5a1', 'a89a46c5-eacb-4a5d-9cd0-1e9533bc2798', '1b', 2, NOW(), NOW()),
  ('756c6746-8951-466d-a857-bf862f135916', 'a89a46c5-eacb-4a5d-9cd0-1e9533bc2798', '2a', 1, NOW(), NOW()),
  ('22c36e3a-66b2-42c2-9f27-2e161e79d7c6', 'a89a46c5-eacb-4a5d-9cd0-1e9533bc2798', '2b', 4, NOW(), NOW()),
  ('07c8ca57-8be4-4e01-a097-b8850c8e0cce', 'a89a46c5-eacb-4a5d-9cd0-1e9533bc2798', '3a', 3, NOW(), NOW()),
  ('31496ae6-4035-49f7-a91e-3714fb535275', 'a89a46c5-eacb-4a5d-9cd0-1e9533bc2798', '3b', 2, NOW(), NOW()),
  ('d059b08d-848f-4360-a64e-dfc03ac8982b', 'a89a46c5-eacb-4a5d-9cd0-1e9533bc2798', '4a', 1, NOW(), NOW()),
  ('df23ee99-8227-4217-8c1b-666504713641', 'a89a46c5-eacb-4a5d-9cd0-1e9533bc2798', '4b', 4, NOW(), NOW()),
  ('b64dcdac-2c59-4db3-b661-36a65474aff3', 'a89a46c5-eacb-4a5d-9cd0-1e9533bc2798', '5a', 3, NOW(), NOW()),
  ('af6a9e13-55e8-4039-9d48-efb8448367f6', 'a89a46c5-eacb-4a5d-9cd0-1e9533bc2798', '5b', 2, NOW(), NOW()),
  ('ef8222da-163d-4296-8d9b-23bf0de514a5', 'a89a46c5-eacb-4a5d-9cd0-1e9533bc2798', '6a', 1, NOW(), NOW()),
  ('4ef9b003-8295-4f4b-86ed-bc6e67c1452d', 'a89a46c5-eacb-4a5d-9cd0-1e9533bc2798', '6b', 4, NOW(), NOW()),
  ('64e0d3a6-b613-48f5-beb6-22392913be8a', 'a89a46c5-eacb-4a5d-9cd0-1e9533bc2798', '7a', 3, NOW(), NOW()),
  ('33cc4923-201a-4ff5-91b1-bb472548eb82', 'a89a46c5-eacb-4a5d-9cd0-1e9533bc2798', '7b', 2, NOW(), NOW()),
  ('31b8d136-b6a9-4a64-92bc-5f16748365af', 'a89a46c5-eacb-4a5d-9cd0-1e9533bc2798', '8a', 1, NOW(), NOW()),
  ('dbe2ee91-0d99-4f8a-9bfc-0db1e6481d59', 'a89a46c5-eacb-4a5d-9cd0-1e9533bc2798', '8b', 4, NOW(), NOW()),
  ('09d6b47e-b81f-40c6-99d9-9d4599e656ef', 'a89a46c5-eacb-4a5d-9cd0-1e9533bc2798', '9a', 3, NOW(), NOW()),
  ('b7056900-6da6-4591-91b7-0773208ca9a5', 'a89a46c5-eacb-4a5d-9cd0-1e9533bc2798', '9b', 2, NOW(), NOW()),
  ('f2052e41-57fd-47c1-a3f2-eff12d93ffdb', 'a89a46c5-eacb-4a5d-9cd0-1e9533bc2798', '10a', 1, NOW(), NOW()),
  ('f3c8fb45-670f-4666-8c46-848530b61775', 'a89a46c5-eacb-4a5d-9cd0-1e9533bc2798', '10b', 4, NOW(), NOW()),
  ('b640f1a1-aabe-492c-96ab-a7bb838a50d6', 'a89a46c5-eacb-4a5d-9cd0-1e9533bc2798', '11a', 3, NOW(), NOW()),
  ('2b07b916-7c54-4575-8cbb-7170f1c37708', 'a89a46c5-eacb-4a5d-9cd0-1e9533bc2798', '11b', 2, NOW(), NOW()),
  ('0ce798a1-ed3a-4e19-99f4-ab96df345d8f', 'a89a46c5-eacb-4a5d-9cd0-1e9533bc2798', '12a', 1, NOW(), NOW()),
  ('2ded7430-55cf-4815-afb4-65c666cabd02', 'a89a46c5-eacb-4a5d-9cd0-1e9533bc2798', '12b', 4, NOW(), NOW()),
  ('c6bf1162-24f2-4d31-ae8d-6525ceeacf31', 'a89a46c5-eacb-4a5d-9cd0-1e9533bc2798', '13a', 3, NOW(), NOW()),
  ('48774489-1db8-4eca-a603-a91207b26dc4', 'a89a46c5-eacb-4a5d-9cd0-1e9533bc2798', '13b', 2, NOW(), NOW()),
  ('3de00afc-0036-4765-80ab-35f5fbdf84ef', 'a89a46c5-eacb-4a5d-9cd0-1e9533bc2798', '14a', 1, NOW(), NOW()),
  ('9fc24261-f8df-4a74-b104-838c943383a0', 'a89a46c5-eacb-4a5d-9cd0-1e9533bc2798', '14b', 4, NOW(), NOW()),
  ('6bb9da07-cd9e-4040-ac6c-873cb04796bf', 'a89a46c5-eacb-4a5d-9cd0-1e9533bc2798', '15a', 3, NOW(), NOW()),
  ('130af79a-53d6-43a6-a2be-ba042432daab', 'a89a46c5-eacb-4a5d-9cd0-1e9533bc2798', '15b', 2, NOW(), NOW()),
  ('6dd38486-3eef-4680-8544-2851c9dcfa4b', '968f1cac-0e08-4d4b-b75d-7a9b7f06e440', '1a', 2, NOW(), NOW()),
  ('fbe06ea0-a4b8-41e3-816d-aae6f0367bc9', '968f1cac-0e08-4d4b-b75d-7a9b7f06e440', '1b', null, NOW(), NOW()),
  ('1127c89a-02bf-44d1-98ec-b4d071243912', '968f1cac-0e08-4d4b-b75d-7a9b7f06e440', '2a', 4, NOW(), NOW()),
  ('6007b1f4-544f-448a-bbe3-c14daa8710e1', '968f1cac-0e08-4d4b-b75d-7a9b7f06e440', '2b', 3, NOW(), NOW()),
  ('c10ec8a0-5d42-4c52-8c7d-7af9f9dc4f4a', '968f1cac-0e08-4d4b-b75d-7a9b7f06e440', '3a', 2, NOW(), NOW()),
  ('71d8c977-5b4b-4622-81ac-87a09984de01', '968f1cac-0e08-4d4b-b75d-7a9b7f06e440', '3b', null, NOW(), NOW()),
  ('3b206162-c066-486e-a32d-a51bcab98761', '968f1cac-0e08-4d4b-b75d-7a9b7f06e440', '4a', 4, NOW(), NOW()),
  ('a7872d0b-bde4-4a5c-9d33-7879c930d025', '968f1cac-0e08-4d4b-b75d-7a9b7f06e440', '4b', 3, NOW(), NOW()),
  ('449025d6-5067-4323-8676-e663d3ea7e5a', '968f1cac-0e08-4d4b-b75d-7a9b7f06e440', '5a', 2, NOW(), NOW()),
  ('3df5ddd0-f58f-4c88-b521-bb20a0ec4df8', '968f1cac-0e08-4d4b-b75d-7a9b7f06e440', '5b', null, NOW(), NOW()),
  ('a27aaac4-3169-4d84-9c27-38af3e805aa0', '968f1cac-0e08-4d4b-b75d-7a9b7f06e440', '6a', 4, NOW(), NOW()),
  ('4e2cda2f-bef0-4983-818b-196ba975169c', '968f1cac-0e08-4d4b-b75d-7a9b7f06e440', '6b', 3, NOW(), NOW()),
  ('c91d5774-d5d3-4461-b0ac-dd1656739cdf', '968f1cac-0e08-4d4b-b75d-7a9b7f06e440', '7a', 2, NOW(), NOW()),
  ('443db89e-747f-459a-9963-8597ec753cc0', '968f1cac-0e08-4d4b-b75d-7a9b7f06e440', '7b', null, NOW(), NOW());

COMMIT;

-- ────────────────────────────────────────────────────────────────
-- Done.
--
-- Sample super admin login:
--   email:    superadmin@forefront.example
--   password: change-me-on-first-login
--
-- Sample cohort access code (share with respondents): SAGJCA
-- ────────────────────────────────────────────────────────────────
