-- Seed sample data for The Endurance Assessment (cohort-code model).
-- Run AFTER 000_initial_schema.sql.
-- Mirrors prisma/seed.ts. Idempotent for the assessment row; ON CONFLICT for the super admin.

BEGIN;

-- Super admin
INSERT INTO "Admin" ("id", "email", "passwordHash", "name", "role", "isActive", "createdAt", "updatedAt")
VALUES ('29bc04bb-ccc3-4c71-bf9e-3bcc38f03d80', 'superadmin@forefront.example', '$2a$10$5s.9p1.PcMX6M3yL6r23JeCzACXT.qyfoXWBt6GimZjSf7WO4Kjbe', 'Super Admin', 'super_admin', TRUE, NOW(), NOW())
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
SELECT 'aae7920d-6c6b-43be-946d-1b24d32f615e', 'Acme Corp (sample)', 'TZPRUN', 8, 'collecting', NOW() + INTERVAL '14 days', _seed_admin."id", NOW(), NOW()
FROM _seed_admin;

-- Departments
INSERT INTO "Department" ("id", "assessmentId", "name", "createdAt") VALUES
  ('20bc6062-6cb4-4c3d-bead-6447b03bf117', 'aae7920d-6c6b-43be-946d-1b24d32f615e', 'Sales',       NOW()),
  ('1b00d85c-d225-467e-aa98-3f51e3b91464',   'aae7920d-6c6b-43be-946d-1b24d32f615e', 'Engineering', NOW());

-- Respondents (5 sample rows: 3 submitted, 1 in-progress, 1 fresh-no-answers)
INSERT INTO "Respondent" ("id", "assessmentId", "name", "departmentId", "level", "tenure", "startedAt", "submittedAt", "createdAt", "updatedAt") VALUES
  ('b3731db2-cc05-4155-b2fd-1b28d6f7bc92', 'aae7920d-6c6b-43be-946d-1b24d32f615e', 'Avery R.', '20bc6062-6cb4-4c3d-bead-6447b03bf117', 'manager', 'y4_7', NOW(), NOW(), NOW(), NOW()),
  ('f888a36d-4120-4304-bedb-598854e8f362', 'aae7920d-6c6b-43be-946d-1b24d32f615e', 'Blake S.', '20bc6062-6cb4-4c3d-bead-6447b03bf117', 'senior_leader', 'y8_15', NOW(), NOW(), NOW(), NOW()),
  ('47ae35f1-86b1-4989-b82d-c35d89430bd5', 'aae7920d-6c6b-43be-946d-1b24d32f615e', 'Casey T.', '1b00d85c-d225-467e-aa98-3f51e3b91464', 'executive', 'gt_15y', NOW(), NOW(), NOW(), NOW()),
  ('fb654d54-38cd-482d-8104-e613fc239531', 'aae7920d-6c6b-43be-946d-1b24d32f615e', 'Drew V.', '1b00d85c-d225-467e-aa98-3f51e3b91464', 'team_lead', 'y1_3', NOW(), NULL, NOW(), NOW()),
  ('2dfbd741-98bc-421c-9fbb-2120264ffe9e', 'aae7920d-6c6b-43be-946d-1b24d32f615e', NULL, '1b00d85c-d225-467e-aa98-3f51e3b91464', 'individual_contributor', 'lt_1y', NOW(), NULL, NOW(), NOW());

-- Responses (submitted respondents have all 30; #4 has the first 28; #5 has zero)
INSERT INTO "Response" ("id", "respondentId", "questionId", "value", "createdAt", "updatedAt") VALUES
  ('8ac53d67-58ed-429b-a6d4-2ba15c26fe97', 'b3731db2-cc05-4155-b2fd-1b28d6f7bc92', '1a', 2, NOW(), NOW()),
  ('c60f9590-b5c2-4c0a-8765-06361b02288b', 'b3731db2-cc05-4155-b2fd-1b28d6f7bc92', '1b', 5, NOW(), NOW()),
  ('1a1113eb-258f-400d-b5f3-39984632cf09', 'b3731db2-cc05-4155-b2fd-1b28d6f7bc92', '2a', 4, NOW(), NOW()),
  ('ba23096b-69f2-4f0a-933d-9649a7e8ac60', 'b3731db2-cc05-4155-b2fd-1b28d6f7bc92', '2b', 3, NOW(), NOW()),
  ('c4ef2552-535c-4f9c-866f-f6a9b2362503', 'b3731db2-cc05-4155-b2fd-1b28d6f7bc92', '3a', 2, NOW(), NOW()),
  ('a57d12e2-ea9c-4c3b-8c08-b647a4f942a8', 'b3731db2-cc05-4155-b2fd-1b28d6f7bc92', '3b', 5, NOW(), NOW()),
  ('7cf39279-0924-487f-be1e-bab32cd6cd8d', 'b3731db2-cc05-4155-b2fd-1b28d6f7bc92', '4a', 4, NOW(), NOW()),
  ('2d8e8c58-f4e8-4cb2-9b73-cca22951e953', 'b3731db2-cc05-4155-b2fd-1b28d6f7bc92', '4b', 3, NOW(), NOW()),
  ('e7b62d96-794a-4913-b047-ebab8c633f59', 'b3731db2-cc05-4155-b2fd-1b28d6f7bc92', '5a', 2, NOW(), NOW()),
  ('f2ac09ef-e7db-4289-b36e-31bbb2c359ae', 'b3731db2-cc05-4155-b2fd-1b28d6f7bc92', '5b', 5, NOW(), NOW()),
  ('4c1ab756-0715-4cf6-ab77-238c56a71a1f', 'b3731db2-cc05-4155-b2fd-1b28d6f7bc92', '6a', 4, NOW(), NOW()),
  ('019feb0e-085a-45b8-95f3-e8ba92876d36', 'b3731db2-cc05-4155-b2fd-1b28d6f7bc92', '6b', 3, NOW(), NOW()),
  ('f5116f2b-2d18-43d0-80cc-03327cfe326f', 'b3731db2-cc05-4155-b2fd-1b28d6f7bc92', '7a', 2, NOW(), NOW()),
  ('a01edcc9-fcaf-4e50-9d22-0e04e488d36a', 'b3731db2-cc05-4155-b2fd-1b28d6f7bc92', '7b', 5, NOW(), NOW()),
  ('40953163-1f8d-4624-bef8-fa20fad07aa2', 'b3731db2-cc05-4155-b2fd-1b28d6f7bc92', '8a', 4, NOW(), NOW()),
  ('d506f274-cc3f-4cf6-81d5-ddf25c4a44b6', 'b3731db2-cc05-4155-b2fd-1b28d6f7bc92', '8b', 3, NOW(), NOW()),
  ('d7a674e2-cc95-48aa-b7bb-26bbe19ea452', 'b3731db2-cc05-4155-b2fd-1b28d6f7bc92', '9a', 2, NOW(), NOW()),
  ('c3645563-db41-44e5-8d21-6127f7a845a0', 'b3731db2-cc05-4155-b2fd-1b28d6f7bc92', '9b', 5, NOW(), NOW()),
  ('f51da4ff-6387-45e5-a981-6cd71a4fee6b', 'b3731db2-cc05-4155-b2fd-1b28d6f7bc92', '10a', 4, NOW(), NOW()),
  ('2c503443-eaac-411c-b7e7-1076f78a4d72', 'b3731db2-cc05-4155-b2fd-1b28d6f7bc92', '10b', 3, NOW(), NOW()),
  ('b64ea25b-ea7e-44b7-9734-e128dd2c8a51', 'b3731db2-cc05-4155-b2fd-1b28d6f7bc92', '11a', 2, NOW(), NOW()),
  ('fa9fe87e-49c1-47e2-a6f0-d81c92405fac', 'b3731db2-cc05-4155-b2fd-1b28d6f7bc92', '11b', 5, NOW(), NOW()),
  ('8ad5518e-08bc-4065-8e50-ec9fee3ec62d', 'b3731db2-cc05-4155-b2fd-1b28d6f7bc92', '12a', 4, NOW(), NOW()),
  ('3e851d10-82c2-47b1-a275-c08d7c368da3', 'b3731db2-cc05-4155-b2fd-1b28d6f7bc92', '12b', 3, NOW(), NOW()),
  ('2f0f2fb0-d74f-4dc0-a634-2064d3e93209', 'b3731db2-cc05-4155-b2fd-1b28d6f7bc92', '13a', 2, NOW(), NOW()),
  ('7f555501-c0d3-47e3-937a-42db48f47e60', 'b3731db2-cc05-4155-b2fd-1b28d6f7bc92', '13b', 5, NOW(), NOW()),
  ('c90e4ff9-f905-4909-8232-413f808f49d0', 'b3731db2-cc05-4155-b2fd-1b28d6f7bc92', '14a', 4, NOW(), NOW()),
  ('45d5dd15-ac42-4bfb-8b5e-0743b651b374', 'b3731db2-cc05-4155-b2fd-1b28d6f7bc92', '14b', 3, NOW(), NOW()),
  ('61ab7d48-e6ac-42bc-a51b-f397879aeb6d', 'b3731db2-cc05-4155-b2fd-1b28d6f7bc92', '15a', 2, NOW(), NOW()),
  ('d746566e-ae69-489d-9235-6f7627b29f71', 'b3731db2-cc05-4155-b2fd-1b28d6f7bc92', '15b', 5, NOW(), NOW()),
  ('95c27fa3-2224-4656-bc18-d7ded4fc6582', 'f888a36d-4120-4304-bedb-598854e8f362', '1a', 5, NOW(), NOW()),
  ('0ff727c7-1299-4ec2-bdf3-c9ad9d0a748b', 'f888a36d-4120-4304-bedb-598854e8f362', '1b', 4, NOW(), NOW()),
  ('41c40369-e746-409a-a4d0-5b27e4adad6f', 'f888a36d-4120-4304-bedb-598854e8f362', '2a', 3, NOW(), NOW()),
  ('498a71ec-7289-457e-9286-d87dbba5f699', 'f888a36d-4120-4304-bedb-598854e8f362', '2b', 2, NOW(), NOW()),
  ('eb9b18dd-5a1b-4997-b987-8fc278475c93', 'f888a36d-4120-4304-bedb-598854e8f362', '3a', 5, NOW(), NOW()),
  ('dc946aca-86fd-4539-9d2b-ffe99c174279', 'f888a36d-4120-4304-bedb-598854e8f362', '3b', 4, NOW(), NOW()),
  ('9342a3df-ebc0-4354-9c11-da850e1973be', 'f888a36d-4120-4304-bedb-598854e8f362', '4a', 3, NOW(), NOW()),
  ('d2bd45f3-1fe3-4e69-9989-77932d4fb1a5', 'f888a36d-4120-4304-bedb-598854e8f362', '4b', 2, NOW(), NOW()),
  ('0b9209f6-cfc5-4182-9585-55febd42f045', 'f888a36d-4120-4304-bedb-598854e8f362', '5a', 5, NOW(), NOW()),
  ('1008a6d2-735a-4382-b4b3-1553567c1ffc', 'f888a36d-4120-4304-bedb-598854e8f362', '5b', 4, NOW(), NOW()),
  ('225c156b-b765-4233-8da0-25633840141d', 'f888a36d-4120-4304-bedb-598854e8f362', '6a', 3, NOW(), NOW()),
  ('c0c2539b-2afe-4934-8f7d-5a7cec85ce98', 'f888a36d-4120-4304-bedb-598854e8f362', '6b', 2, NOW(), NOW()),
  ('f5350912-6f86-44e2-a7d9-5f9cbbce6415', 'f888a36d-4120-4304-bedb-598854e8f362', '7a', 5, NOW(), NOW()),
  ('a5811554-5994-4edc-a0e3-4a5d1340b275', 'f888a36d-4120-4304-bedb-598854e8f362', '7b', 4, NOW(), NOW()),
  ('022c16ac-b4b8-4ebe-bf99-60c6c41da5bc', 'f888a36d-4120-4304-bedb-598854e8f362', '8a', 3, NOW(), NOW()),
  ('e2174812-d849-47b3-89a2-f8d96dd70bb4', 'f888a36d-4120-4304-bedb-598854e8f362', '8b', 2, NOW(), NOW()),
  ('2b2d50b2-a218-461f-a6c1-b83e5ef60e3d', 'f888a36d-4120-4304-bedb-598854e8f362', '9a', 5, NOW(), NOW()),
  ('90c58171-e421-4c19-8f2e-f505cdf5e47e', 'f888a36d-4120-4304-bedb-598854e8f362', '9b', 4, NOW(), NOW()),
  ('9e81c2a6-f3c0-4dfe-b18a-d7f00c660909', 'f888a36d-4120-4304-bedb-598854e8f362', '10a', 3, NOW(), NOW()),
  ('2212b645-baba-4cc1-96d6-9d8292b7d269', 'f888a36d-4120-4304-bedb-598854e8f362', '10b', 2, NOW(), NOW()),
  ('7ff41526-01af-4051-9546-c9111e4d12d8', 'f888a36d-4120-4304-bedb-598854e8f362', '11a', 5, NOW(), NOW()),
  ('52584779-de98-440b-820a-03f4ced6c2a9', 'f888a36d-4120-4304-bedb-598854e8f362', '11b', 4, NOW(), NOW()),
  ('8e006908-697a-4164-b6ee-146e0bfd5b85', 'f888a36d-4120-4304-bedb-598854e8f362', '12a', 3, NOW(), NOW()),
  ('86fbcd8a-86fd-4615-befb-056f897926e7', 'f888a36d-4120-4304-bedb-598854e8f362', '12b', 2, NOW(), NOW()),
  ('4f2abf68-d968-4b27-9d55-a98a0a085a8f', 'f888a36d-4120-4304-bedb-598854e8f362', '13a', 5, NOW(), NOW()),
  ('2f69658b-72a8-4145-bed9-825690c558e3', 'f888a36d-4120-4304-bedb-598854e8f362', '13b', 4, NOW(), NOW()),
  ('7f92c70d-e433-46ad-ab8a-11594c31cc3e', 'f888a36d-4120-4304-bedb-598854e8f362', '14a', 3, NOW(), NOW()),
  ('b00b4b51-4de3-4524-b642-4c4ce961c010', 'f888a36d-4120-4304-bedb-598854e8f362', '14b', 2, NOW(), NOW()),
  ('1fcb6c7d-7eee-4c7e-93b5-469c229c3dc0', 'f888a36d-4120-4304-bedb-598854e8f362', '15a', 5, NOW(), NOW()),
  ('45610861-15b9-4098-a801-deeb7df6f85a', 'f888a36d-4120-4304-bedb-598854e8f362', '15b', 4, NOW(), NOW()),
  ('37b03814-0027-44e8-b741-261df2176e07', '47ae35f1-86b1-4989-b82d-c35d89430bd5', '1a', 4, NOW(), NOW()),
  ('bca1d18e-24ab-44db-92a1-df04aa42b317', '47ae35f1-86b1-4989-b82d-c35d89430bd5', '1b', 3, NOW(), NOW()),
  ('fb3aa792-6627-409d-b789-aadcc0c729f0', '47ae35f1-86b1-4989-b82d-c35d89430bd5', '2a', 2, NOW(), NOW()),
  ('96f8a176-f9e3-489c-9976-966905eb7791', '47ae35f1-86b1-4989-b82d-c35d89430bd5', '2b', 5, NOW(), NOW()),
  ('dd1d307f-000e-439f-b604-a11ca6751c66', '47ae35f1-86b1-4989-b82d-c35d89430bd5', '3a', 4, NOW(), NOW()),
  ('4200c949-6378-4f16-a00d-b94e20aab018', '47ae35f1-86b1-4989-b82d-c35d89430bd5', '3b', 3, NOW(), NOW()),
  ('c42034a6-ad64-48e9-a9e9-acab49187fa6', '47ae35f1-86b1-4989-b82d-c35d89430bd5', '4a', 2, NOW(), NOW()),
  ('8b8ff612-fecb-4d0e-a373-78c77de884db', '47ae35f1-86b1-4989-b82d-c35d89430bd5', '4b', 5, NOW(), NOW()),
  ('3dcb0e29-e9c8-4ee1-a060-21679e4f15c3', '47ae35f1-86b1-4989-b82d-c35d89430bd5', '5a', 4, NOW(), NOW()),
  ('04c5c301-275e-4d8e-9384-0483876cf5ef', '47ae35f1-86b1-4989-b82d-c35d89430bd5', '5b', 3, NOW(), NOW()),
  ('a764b1b6-efba-404d-96e5-26dab0944c04', '47ae35f1-86b1-4989-b82d-c35d89430bd5', '6a', 2, NOW(), NOW()),
  ('bf7110c2-9953-4cec-b1e5-c0e55c9c994b', '47ae35f1-86b1-4989-b82d-c35d89430bd5', '6b', 5, NOW(), NOW()),
  ('031e8680-a32f-4724-bc7c-9761637bcb68', '47ae35f1-86b1-4989-b82d-c35d89430bd5', '7a', 4, NOW(), NOW()),
  ('b428af8f-f94a-4b56-b49f-904d88a43ffa', '47ae35f1-86b1-4989-b82d-c35d89430bd5', '7b', 3, NOW(), NOW()),
  ('572b9eaf-5d9f-4ffd-bf10-f0035ff4026d', '47ae35f1-86b1-4989-b82d-c35d89430bd5', '8a', 2, NOW(), NOW()),
  ('4de1f18f-a725-4872-a9d3-41fb3d81e6e8', '47ae35f1-86b1-4989-b82d-c35d89430bd5', '8b', 5, NOW(), NOW()),
  ('ec535b16-bc52-408d-9bda-5e58c808156e', '47ae35f1-86b1-4989-b82d-c35d89430bd5', '9a', 4, NOW(), NOW()),
  ('34a48bf2-8829-4a84-ad75-56ab4e533171', '47ae35f1-86b1-4989-b82d-c35d89430bd5', '9b', 3, NOW(), NOW()),
  ('afc521f3-b156-4da5-83c4-69bf21fdb8a3', '47ae35f1-86b1-4989-b82d-c35d89430bd5', '10a', 2, NOW(), NOW()),
  ('41dcbc83-65d5-4a16-9c9d-60b43aa5fac4', '47ae35f1-86b1-4989-b82d-c35d89430bd5', '10b', 5, NOW(), NOW()),
  ('ba758edc-5273-49c6-994a-6199540b8327', '47ae35f1-86b1-4989-b82d-c35d89430bd5', '11a', 4, NOW(), NOW()),
  ('3e751f7e-4173-4b39-8a72-c1c01568be50', '47ae35f1-86b1-4989-b82d-c35d89430bd5', '11b', 3, NOW(), NOW()),
  ('03c307e2-86b8-4e74-9caf-9945ba0e3a07', '47ae35f1-86b1-4989-b82d-c35d89430bd5', '12a', 2, NOW(), NOW()),
  ('455fc0b0-5baa-4d91-b58b-7e3322d618ad', '47ae35f1-86b1-4989-b82d-c35d89430bd5', '12b', 5, NOW(), NOW()),
  ('1dd10e59-36c8-47f7-b3b6-1c3ea7840908', '47ae35f1-86b1-4989-b82d-c35d89430bd5', '13a', 4, NOW(), NOW()),
  ('a708e7c1-d0b7-4733-8f26-81c20e12b72a', '47ae35f1-86b1-4989-b82d-c35d89430bd5', '13b', 3, NOW(), NOW()),
  ('503a5fb1-284e-4a9e-a1ed-9ee584f010b6', '47ae35f1-86b1-4989-b82d-c35d89430bd5', '14a', 2, NOW(), NOW()),
  ('60cbf057-17cb-4b0c-a804-bc2a03c43043', '47ae35f1-86b1-4989-b82d-c35d89430bd5', '14b', 5, NOW(), NOW()),
  ('b00d7e04-2563-4ff5-8e3e-86e153362bd8', '47ae35f1-86b1-4989-b82d-c35d89430bd5', '15a', 4, NOW(), NOW()),
  ('1f5b97c2-7971-42df-8d47-5864f68b14ec', '47ae35f1-86b1-4989-b82d-c35d89430bd5', '15b', 3, NOW(), NOW()),
  ('57f23269-666d-4858-adbb-973bce28b383', 'fb654d54-38cd-482d-8104-e613fc239531', '1a', 3, NOW(), NOW()),
  ('ffee45eb-56a9-43b5-a7c8-7c3e4e178092', 'fb654d54-38cd-482d-8104-e613fc239531', '1b', 2, NOW(), NOW()),
  ('b47ef19b-b395-49dc-892f-c83071e4999d', 'fb654d54-38cd-482d-8104-e613fc239531', '2a', 5, NOW(), NOW()),
  ('d7b5b789-35c9-45bc-b507-4a4992ecb1f3', 'fb654d54-38cd-482d-8104-e613fc239531', '2b', 4, NOW(), NOW()),
  ('dd8b6d55-af1f-4d5f-9460-592fc74545b6', 'fb654d54-38cd-482d-8104-e613fc239531', '3a', 3, NOW(), NOW()),
  ('84299180-72ea-4ed8-b306-c89fe38e6663', 'fb654d54-38cd-482d-8104-e613fc239531', '3b', 2, NOW(), NOW()),
  ('ae598f97-43ec-4602-be5d-a3018addb2e6', 'fb654d54-38cd-482d-8104-e613fc239531', '4a', 5, NOW(), NOW()),
  ('e2abb2eb-7140-4ab1-9e3e-ef1f9c941387', 'fb654d54-38cd-482d-8104-e613fc239531', '4b', 4, NOW(), NOW()),
  ('d6b029bc-e3cd-4010-aceb-ed501efc0f17', 'fb654d54-38cd-482d-8104-e613fc239531', '5a', 3, NOW(), NOW()),
  ('da010b55-6bcd-45f9-90c3-9482a3ffcc4b', 'fb654d54-38cd-482d-8104-e613fc239531', '5b', 2, NOW(), NOW()),
  ('2a0c0174-dc64-40c0-a0d6-7b1b0c6c4ebe', 'fb654d54-38cd-482d-8104-e613fc239531', '6a', 5, NOW(), NOW()),
  ('96ed068f-5802-426d-8abc-c449f0621ee9', 'fb654d54-38cd-482d-8104-e613fc239531', '6b', 4, NOW(), NOW()),
  ('16508d5f-f076-4b0e-83fa-751488183c75', 'fb654d54-38cd-482d-8104-e613fc239531', '7a', 3, NOW(), NOW()),
  ('b584c645-a013-4852-b6c0-26280d120a13', 'fb654d54-38cd-482d-8104-e613fc239531', '7b', 2, NOW(), NOW());

COMMIT;

-- ────────────────────────────────────────────────────────────────
-- Done.
--
-- Sample super admin login:
--   email:    superadmin@forefront.example
--   password: change-me-on-first-login
--
-- Sample cohort access code (share with respondents): TZPRUN
-- ────────────────────────────────────────────────────────────────
