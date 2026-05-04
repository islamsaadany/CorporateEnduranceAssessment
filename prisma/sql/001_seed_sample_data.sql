-- Seed sample data for The Endurance Assessment (cohort-code model).
-- Run AFTER 000_initial_schema.sql.
-- Mirrors prisma/seed.ts. Idempotent for the assessment row; ON CONFLICT for the super admin.

BEGIN;

-- Super admin
INSERT INTO "Admin" ("id", "email", "passwordHash", "name", "role", "isActive", "createdAt", "updatedAt")
VALUES ('0aab0ccd-615d-4220-a235-29b4844f1986', 'admin', '$2a$10$uIXdJXefHjTDJbnJnPiiWOZ.1YiRTaV9hs/LDpOj2pIIsVbOAHag6', 'Super Admin', 'super_admin', TRUE, NOW(), NOW())
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
SELECT '990f01ff-5bd1-45e6-9303-4a30db12f858', 'Acme Corp (sample)', 'FCTQD3', 8, 'collecting', NOW() + INTERVAL '14 days', _seed_admin."id", NOW(), NOW()
FROM _seed_admin;

-- Departments
INSERT INTO "Department" ("id", "assessmentId", "name", "createdAt") VALUES
  ('36f0e5f1-4eae-4be6-a75b-4a3f8af5a0ba', '990f01ff-5bd1-45e6-9303-4a30db12f858', 'Sales',       NOW()),
  ('0e602f1d-17de-464f-ac34-9de59c40facf',   '990f01ff-5bd1-45e6-9303-4a30db12f858', 'Engineering', NOW());

-- Respondents (5 sample rows: 3 submitted, 1 in-progress, 1 fresh-no-answers).
-- All have demographicsCompletedAt set so they show up in the admin table.
INSERT INTO "Respondent" ("id", "assessmentId", "name", "departmentId", "level", "tenure", "demographicsCompletedAt", "startedAt", "submittedAt", "createdAt", "updatedAt") VALUES
  ('ef58ffff-ddb3-4662-ada9-4a457c66a2f1', '990f01ff-5bd1-45e6-9303-4a30db12f858', 'Avery R.', '36f0e5f1-4eae-4be6-a75b-4a3f8af5a0ba', 'manager', 'y4_7', NOW(), NOW(), NOW(), NOW(), NOW()),
  ('e99679e1-9bc0-4aa2-bf60-2498ff767263', '990f01ff-5bd1-45e6-9303-4a30db12f858', 'Blake S.', '36f0e5f1-4eae-4be6-a75b-4a3f8af5a0ba', 'senior_leader', 'y8_15', NOW(), NOW(), NOW(), NOW(), NOW()),
  ('b981b333-485b-44c3-b2bf-9829d32631a7', '990f01ff-5bd1-45e6-9303-4a30db12f858', 'Casey T.', '0e602f1d-17de-464f-ac34-9de59c40facf', 'senior_leader', 'gt_15y', NOW(), NOW(), NOW(), NOW(), NOW()),
  ('af415222-bb30-412d-ab03-a6beb20140a7', '990f01ff-5bd1-45e6-9303-4a30db12f858', 'Drew V.', '0e602f1d-17de-464f-ac34-9de59c40facf', 'team_leader', 'y1_3', NOW(), NOW(), NULL, NOW(), NOW()),
  ('7a7b12ad-afa1-4037-8456-0c22b10fb593', '990f01ff-5bd1-45e6-9303-4a30db12f858', 'Eli W.', '0e602f1d-17de-464f-ac34-9de59c40facf', 'individual_contributor', 'lt_1y', NOW(), NOW(), NULL, NOW(), NOW());

-- Responses (submitted respondents have all 30; #4 has 14 of 30; #5 has zero).
-- value=NULL means "I don't know" (a deliberate non-answer).
INSERT INTO "Response" ("id", "respondentId", "questionId", "value", "createdAt", "updatedAt") VALUES
  ('5757e17b-45b4-4e6c-adb9-78ee10e5aefe', 'ef58ffff-ddb3-4662-ada9-4a457c66a2f1', '1a', null, NOW(), NOW()),
  ('5d00b452-0145-483c-ad92-40f2ec82393b', 'ef58ffff-ddb3-4662-ada9-4a457c66a2f1', '1b', 4, NOW(), NOW()),
  ('be05d677-2da8-4b18-a20d-397571639419', 'ef58ffff-ddb3-4662-ada9-4a457c66a2f1', '2a', 3, NOW(), NOW()),
  ('67799c22-e0d8-4e50-9095-299c9c94655c', 'ef58ffff-ddb3-4662-ada9-4a457c66a2f1', '2b', 2, NOW(), NOW()),
  ('cab6f7bc-8549-4e9a-b364-7dff98d98b91', 'ef58ffff-ddb3-4662-ada9-4a457c66a2f1', '3a', null, NOW(), NOW()),
  ('508ccd4e-b638-42a6-be13-c8e7fa55e859', 'ef58ffff-ddb3-4662-ada9-4a457c66a2f1', '3b', 4, NOW(), NOW()),
  ('5c92e4ca-7ca4-4eec-9876-bd790d7e033a', 'ef58ffff-ddb3-4662-ada9-4a457c66a2f1', '4a', 3, NOW(), NOW()),
  ('76f5587c-d3e4-48de-85fd-45280df6a123', 'ef58ffff-ddb3-4662-ada9-4a457c66a2f1', '4b', 2, NOW(), NOW()),
  ('fd870978-cef3-402f-bf0a-51cd629fb08e', 'ef58ffff-ddb3-4662-ada9-4a457c66a2f1', '5a', null, NOW(), NOW()),
  ('d68eb2e3-2b8a-46bd-9fd1-9d67ffa10fc1', 'ef58ffff-ddb3-4662-ada9-4a457c66a2f1', '5b', 4, NOW(), NOW()),
  ('c3ea570e-18b8-4235-b32e-35a38718a8fd', 'ef58ffff-ddb3-4662-ada9-4a457c66a2f1', '6a', 3, NOW(), NOW()),
  ('a2d8e383-5b36-4698-835f-aba9ad85e93a', 'ef58ffff-ddb3-4662-ada9-4a457c66a2f1', '6b', 2, NOW(), NOW()),
  ('035553bd-d84d-4b54-b80e-53b5ab37dbfa', 'ef58ffff-ddb3-4662-ada9-4a457c66a2f1', '7a', null, NOW(), NOW()),
  ('4571aa50-6798-43d5-a4ad-45d073f64197', 'ef58ffff-ddb3-4662-ada9-4a457c66a2f1', '7b', 4, NOW(), NOW()),
  ('1d8600f5-f10f-4dbc-8ac2-1762582d9c2c', 'ef58ffff-ddb3-4662-ada9-4a457c66a2f1', '8a', 3, NOW(), NOW()),
  ('3435971b-2494-4247-8c5b-0290b9275e32', 'ef58ffff-ddb3-4662-ada9-4a457c66a2f1', '8b', 2, NOW(), NOW()),
  ('0acad49d-d318-4875-9f99-d98d05d1f9f6', 'ef58ffff-ddb3-4662-ada9-4a457c66a2f1', '9a', null, NOW(), NOW()),
  ('9c28ff9c-2272-4221-8ea2-d44ad42c22f7', 'ef58ffff-ddb3-4662-ada9-4a457c66a2f1', '9b', 4, NOW(), NOW()),
  ('4fde7028-fba6-4244-b989-82f21986efbe', 'ef58ffff-ddb3-4662-ada9-4a457c66a2f1', '10a', 3, NOW(), NOW()),
  ('d423350c-8177-4886-a72d-52123cd7f8c3', 'ef58ffff-ddb3-4662-ada9-4a457c66a2f1', '10b', 2, NOW(), NOW()),
  ('d44d0dd6-7f6c-445d-a862-8649abad6852', 'ef58ffff-ddb3-4662-ada9-4a457c66a2f1', '11a', null, NOW(), NOW()),
  ('4e6b1c2a-9747-4a95-a4e3-3298c26a782e', 'ef58ffff-ddb3-4662-ada9-4a457c66a2f1', '11b', 4, NOW(), NOW()),
  ('4a5d32e1-52de-441e-b27e-0098a2e7304a', 'ef58ffff-ddb3-4662-ada9-4a457c66a2f1', '12a', 3, NOW(), NOW()),
  ('d853671b-e70d-4c2b-8e56-8185481aa411', 'ef58ffff-ddb3-4662-ada9-4a457c66a2f1', '12b', 2, NOW(), NOW()),
  ('7aa9f746-c3b4-4839-b415-2c98a375ff38', 'ef58ffff-ddb3-4662-ada9-4a457c66a2f1', '13a', null, NOW(), NOW()),
  ('c7374b9f-28f7-48f8-8d14-5f3030d2ba7e', 'ef58ffff-ddb3-4662-ada9-4a457c66a2f1', '13b', 4, NOW(), NOW()),
  ('228d9238-f273-472f-bc71-101bfab19de8', 'ef58ffff-ddb3-4662-ada9-4a457c66a2f1', '14a', 3, NOW(), NOW()),
  ('11ec5df6-5f08-40c5-9b41-ee9367d866fe', 'ef58ffff-ddb3-4662-ada9-4a457c66a2f1', '14b', 2, NOW(), NOW()),
  ('fbc99c00-c856-470f-8b3b-c52c9e0d62a4', 'ef58ffff-ddb3-4662-ada9-4a457c66a2f1', '15a', null, NOW(), NOW()),
  ('5f5f3987-4c99-4174-89b9-1c3dffb35fc4', 'ef58ffff-ddb3-4662-ada9-4a457c66a2f1', '15b', 4, NOW(), NOW()),
  ('0396061a-56de-4a31-8742-f3b1c1dc01d9', 'e99679e1-9bc0-4aa2-bf60-2498ff767263', '1a', 4, NOW(), NOW()),
  ('c7e143a8-7616-47c6-9131-b83c32211935', 'e99679e1-9bc0-4aa2-bf60-2498ff767263', '1b', 3, NOW(), NOW()),
  ('c470da2b-4e6e-4637-b3ad-0f2f8ac73f90', 'e99679e1-9bc0-4aa2-bf60-2498ff767263', '2a', 2, NOW(), NOW()),
  ('2513ad57-3ad0-45b7-9b1a-4a9fc5bb798c', 'e99679e1-9bc0-4aa2-bf60-2498ff767263', '2b', 1, NOW(), NOW()),
  ('29f7c9b8-fa7f-4eb6-906a-4b6c9cd5cf1c', 'e99679e1-9bc0-4aa2-bf60-2498ff767263', '3a', 4, NOW(), NOW()),
  ('11ac20d1-ec01-4282-a228-4d4286ee3afb', 'e99679e1-9bc0-4aa2-bf60-2498ff767263', '3b', 3, NOW(), NOW()),
  ('c817a448-b7ec-4d06-898b-1b23920dd55f', 'e99679e1-9bc0-4aa2-bf60-2498ff767263', '4a', 2, NOW(), NOW()),
  ('73c86406-3b56-49b2-b2f3-d7f5038e3a0d', 'e99679e1-9bc0-4aa2-bf60-2498ff767263', '4b', 1, NOW(), NOW()),
  ('1360c596-75b2-4ca6-b396-050b2de14ba2', 'e99679e1-9bc0-4aa2-bf60-2498ff767263', '5a', 4, NOW(), NOW()),
  ('7513bb04-f47d-4c46-9d5b-8307aa00f509', 'e99679e1-9bc0-4aa2-bf60-2498ff767263', '5b', 3, NOW(), NOW()),
  ('34e995b3-e093-4801-aa7c-c38922767118', 'e99679e1-9bc0-4aa2-bf60-2498ff767263', '6a', 2, NOW(), NOW()),
  ('4025af9b-504f-4da5-b2cd-b3fdf314e1d8', 'e99679e1-9bc0-4aa2-bf60-2498ff767263', '6b', 1, NOW(), NOW()),
  ('c0b4940a-dafa-4dfc-bdb5-6f283ecb2d23', 'e99679e1-9bc0-4aa2-bf60-2498ff767263', '7a', 4, NOW(), NOW()),
  ('47f60ade-126f-42b6-bd7c-3e1b0a467d05', 'e99679e1-9bc0-4aa2-bf60-2498ff767263', '7b', 3, NOW(), NOW()),
  ('7bab6098-3494-4948-b370-6ffd9067e8a8', 'e99679e1-9bc0-4aa2-bf60-2498ff767263', '8a', 2, NOW(), NOW()),
  ('70839cef-6907-41e4-9eae-31071ccdc094', 'e99679e1-9bc0-4aa2-bf60-2498ff767263', '8b', 1, NOW(), NOW()),
  ('5030642b-3c22-436e-890c-ef19c8b93920', 'e99679e1-9bc0-4aa2-bf60-2498ff767263', '9a', 4, NOW(), NOW()),
  ('56c36dd0-9848-4ea6-801b-18dc77ed2161', 'e99679e1-9bc0-4aa2-bf60-2498ff767263', '9b', 3, NOW(), NOW()),
  ('dbf9ce9e-f44b-4aa3-b16f-c15fd7dc215d', 'e99679e1-9bc0-4aa2-bf60-2498ff767263', '10a', 2, NOW(), NOW()),
  ('d7a66075-553e-4ecb-94e7-6492a9d1e1d5', 'e99679e1-9bc0-4aa2-bf60-2498ff767263', '10b', 1, NOW(), NOW()),
  ('efe3b385-9cea-46ed-adce-b67d56d54fa5', 'e99679e1-9bc0-4aa2-bf60-2498ff767263', '11a', 4, NOW(), NOW()),
  ('f31e8419-65fd-4995-9039-fec0769a4ef0', 'e99679e1-9bc0-4aa2-bf60-2498ff767263', '11b', 3, NOW(), NOW()),
  ('b7ad3823-cad6-4805-9eb6-ef918e5631df', 'e99679e1-9bc0-4aa2-bf60-2498ff767263', '12a', 2, NOW(), NOW()),
  ('f2d9d21f-0943-41b9-a91c-1af2225a5ffb', 'e99679e1-9bc0-4aa2-bf60-2498ff767263', '12b', 1, NOW(), NOW()),
  ('c0e01ed3-3817-47b8-b8a0-3df833ae9108', 'e99679e1-9bc0-4aa2-bf60-2498ff767263', '13a', 4, NOW(), NOW()),
  ('898d62b5-6052-41f9-8b6e-bd0428f4feb3', 'e99679e1-9bc0-4aa2-bf60-2498ff767263', '13b', 3, NOW(), NOW()),
  ('0dc89c76-1e2a-4ca4-9173-b0a13ccf3e54', 'e99679e1-9bc0-4aa2-bf60-2498ff767263', '14a', 2, NOW(), NOW()),
  ('129c1b14-055d-403a-96d1-746dd9f88a9e', 'e99679e1-9bc0-4aa2-bf60-2498ff767263', '14b', 1, NOW(), NOW()),
  ('be568359-91f8-4865-95dd-b64e9bb39681', 'e99679e1-9bc0-4aa2-bf60-2498ff767263', '15a', 4, NOW(), NOW()),
  ('1a6bfba7-7263-4d78-8597-30b5ef7ac517', 'e99679e1-9bc0-4aa2-bf60-2498ff767263', '15b', 3, NOW(), NOW()),
  ('8bd85f19-affc-40d6-a329-a21798be1ae4', 'b981b333-485b-44c3-b2bf-9829d32631a7', '1a', 3, NOW(), NOW()),
  ('af8f91fb-c4b8-40b4-ac0a-66489e06cf06', 'b981b333-485b-44c3-b2bf-9829d32631a7', '1b', 2, NOW(), NOW()),
  ('0d1ebbc4-e908-4bf8-b2c6-d61798c4357d', 'b981b333-485b-44c3-b2bf-9829d32631a7', '2a', 1, NOW(), NOW()),
  ('c0590d71-9987-449a-84c4-09ca15ebd7c6', 'b981b333-485b-44c3-b2bf-9829d32631a7', '2b', 4, NOW(), NOW()),
  ('99d0799c-38ae-4a45-928e-3a885e7ac89b', 'b981b333-485b-44c3-b2bf-9829d32631a7', '3a', 3, NOW(), NOW()),
  ('f583e2c9-70c4-4a0a-a4d4-89fefd9c1357', 'b981b333-485b-44c3-b2bf-9829d32631a7', '3b', 2, NOW(), NOW()),
  ('5fb09dcf-c473-4859-b75e-7b63930780ca', 'b981b333-485b-44c3-b2bf-9829d32631a7', '4a', 1, NOW(), NOW()),
  ('90399abd-3f90-4c40-be0c-766318dce333', 'b981b333-485b-44c3-b2bf-9829d32631a7', '4b', 4, NOW(), NOW()),
  ('df9d1e4e-bf35-4b18-b8ef-588b1cc10581', 'b981b333-485b-44c3-b2bf-9829d32631a7', '5a', 3, NOW(), NOW()),
  ('c1a053e8-5acb-4948-8179-2306f1448466', 'b981b333-485b-44c3-b2bf-9829d32631a7', '5b', 2, NOW(), NOW()),
  ('a4465667-407b-440a-bd5f-e6ed143bd855', 'b981b333-485b-44c3-b2bf-9829d32631a7', '6a', 1, NOW(), NOW()),
  ('c6dee5a4-c6bf-43f8-8bf7-cb4c5f39711e', 'b981b333-485b-44c3-b2bf-9829d32631a7', '6b', 4, NOW(), NOW()),
  ('425ca552-95aa-4332-9b9b-376972213b49', 'b981b333-485b-44c3-b2bf-9829d32631a7', '7a', 3, NOW(), NOW()),
  ('ec229b0f-fbbc-482a-a397-4436410ebac7', 'b981b333-485b-44c3-b2bf-9829d32631a7', '7b', 2, NOW(), NOW()),
  ('2bbfd575-64e7-4f0d-8b8f-fe0cb1f1b21d', 'b981b333-485b-44c3-b2bf-9829d32631a7', '8a', 1, NOW(), NOW()),
  ('24405694-684f-4803-8e9f-54655d6b199e', 'b981b333-485b-44c3-b2bf-9829d32631a7', '8b', 4, NOW(), NOW()),
  ('2824104a-2fe8-4e77-a3e2-dc9705671e95', 'b981b333-485b-44c3-b2bf-9829d32631a7', '9a', 3, NOW(), NOW()),
  ('957c8532-01ab-4ff5-8b19-b8ccedec1bcd', 'b981b333-485b-44c3-b2bf-9829d32631a7', '9b', 2, NOW(), NOW()),
  ('65d89cbd-a187-4a57-b10a-288471126adb', 'b981b333-485b-44c3-b2bf-9829d32631a7', '10a', 1, NOW(), NOW()),
  ('03182473-43ef-4b18-8a6f-998fe8fd62e5', 'b981b333-485b-44c3-b2bf-9829d32631a7', '10b', 4, NOW(), NOW()),
  ('399b8171-f779-4783-9a27-2b82bf030a3c', 'b981b333-485b-44c3-b2bf-9829d32631a7', '11a', 3, NOW(), NOW()),
  ('9b73a922-db28-46d8-8c75-b2522fad5b05', 'b981b333-485b-44c3-b2bf-9829d32631a7', '11b', 2, NOW(), NOW()),
  ('f5a3629e-b3fd-4523-9f5b-5771246922ca', 'b981b333-485b-44c3-b2bf-9829d32631a7', '12a', 1, NOW(), NOW()),
  ('4706c0ec-c726-4bdb-9c4e-ff8374008371', 'b981b333-485b-44c3-b2bf-9829d32631a7', '12b', 4, NOW(), NOW()),
  ('9d892489-faa0-46e4-bfe4-045ea082fcd5', 'b981b333-485b-44c3-b2bf-9829d32631a7', '13a', 3, NOW(), NOW()),
  ('9fc230ae-9e11-4eb1-a663-e17b04c2a5f3', 'b981b333-485b-44c3-b2bf-9829d32631a7', '13b', 2, NOW(), NOW()),
  ('67a06093-4f93-401a-80a2-73638e3b99e0', 'b981b333-485b-44c3-b2bf-9829d32631a7', '14a', 1, NOW(), NOW()),
  ('7d803719-d293-4569-8d03-002ef2f08b66', 'b981b333-485b-44c3-b2bf-9829d32631a7', '14b', 4, NOW(), NOW()),
  ('a8eb8e96-80ce-4e7c-bdda-aa63e2893069', 'b981b333-485b-44c3-b2bf-9829d32631a7', '15a', 3, NOW(), NOW()),
  ('81bd35d2-b8ed-4b50-a434-b03f27eed1ab', 'b981b333-485b-44c3-b2bf-9829d32631a7', '15b', 2, NOW(), NOW()),
  ('0784131a-1a68-4e47-9255-6ceb4fbdcfc4', 'af415222-bb30-412d-ab03-a6beb20140a7', '1a', 2, NOW(), NOW()),
  ('7e175b44-7316-4392-892a-dd3f0e427206', 'af415222-bb30-412d-ab03-a6beb20140a7', '1b', null, NOW(), NOW()),
  ('eb2a63b9-90d5-45c4-8c10-9ce9c7d2337a', 'af415222-bb30-412d-ab03-a6beb20140a7', '2a', 4, NOW(), NOW()),
  ('5c7f3003-f6c3-4644-a867-e9f310eeb033', 'af415222-bb30-412d-ab03-a6beb20140a7', '2b', 3, NOW(), NOW()),
  ('0d80f84a-c08a-4d3b-87f1-c5bb65e96bca', 'af415222-bb30-412d-ab03-a6beb20140a7', '3a', 2, NOW(), NOW()),
  ('cf04216a-7d8c-43f5-bed7-15bd8d463253', 'af415222-bb30-412d-ab03-a6beb20140a7', '3b', null, NOW(), NOW()),
  ('aa9818be-6c28-4548-affb-a38b0dbe46db', 'af415222-bb30-412d-ab03-a6beb20140a7', '4a', 4, NOW(), NOW()),
  ('ce0d229e-a7d4-45a5-8b07-141156e5385e', 'af415222-bb30-412d-ab03-a6beb20140a7', '4b', 3, NOW(), NOW()),
  ('e3ba70c5-802a-460e-8a97-20b57dbab21d', 'af415222-bb30-412d-ab03-a6beb20140a7', '5a', 2, NOW(), NOW()),
  ('d48f7d53-10db-41de-bd18-8ea00a2b5ed0', 'af415222-bb30-412d-ab03-a6beb20140a7', '5b', null, NOW(), NOW()),
  ('aa52b57a-36ee-4d3e-9687-5d9ff1ae6972', 'af415222-bb30-412d-ab03-a6beb20140a7', '6a', 4, NOW(), NOW()),
  ('7cc0ce72-877a-49b9-96a4-b1e07de7ab82', 'af415222-bb30-412d-ab03-a6beb20140a7', '6b', 3, NOW(), NOW()),
  ('ce7c0be7-aa96-4d83-b28b-4b3f7b618cf9', 'af415222-bb30-412d-ab03-a6beb20140a7', '7a', 2, NOW(), NOW()),
  ('05fc7ce6-c865-4ef0-b490-7ddc21217888', 'af415222-bb30-412d-ab03-a6beb20140a7', '7b', null, NOW(), NOW());

COMMIT;

-- ────────────────────────────────────────────────────────────────
-- Done.
--
-- Sample super admin login:
--   email:    admin
--   password: change-me-on-first-login
--
-- Sample cohort access code (share with respondents): FCTQD3
-- ────────────────────────────────────────────────────────────────
