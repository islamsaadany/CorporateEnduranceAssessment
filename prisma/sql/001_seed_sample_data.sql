-- Seed sample data for The Endurance Assessment.
-- Run AFTER 000_initial_schema.sql.
-- Mirrors prisma/seed.ts. Idempotent for the assessment row; ON CONFLICT for the super admin.

BEGIN;

-- Super admin
INSERT INTO "Admin" ("id", "email", "passwordHash", "name", "role", "isActive", "createdAt", "updatedAt")
VALUES ('cae132e1-a5b6-4c53-8cbe-5df5d9479b3d', 'superadmin@forefront.example', '$2a$10$xpP51M623vfYOIr1Qts5.ORpj4kiHKaBg25cGoRT2l0RwxBqP9ABi', 'Super Admin', 'super_admin', TRUE, NOW(), NOW())
ON CONFLICT ("email") DO UPDATE SET
  "role" = 'super_admin',
  "isActive" = TRUE,
  "name" = EXCLUDED."name",
  "passwordHash" = EXCLUDED."passwordHash",
  "updatedAt" = NOW();

-- Capture the super admin's id (whether it was newly inserted or already existed).
-- Subsequent inserts reference this via a temp table.
CREATE TEMP TABLE _seed_admin AS SELECT "id" FROM "Admin" WHERE "email" = 'superadmin@forefront.example';

-- Settings singleton
INSERT INTO "Settings" ("id", "aiProvider", "promptVersion", "updatedAt")
VALUES ('singleton', 'gemini', 1, NOW())
ON CONFLICT ("id") DO NOTHING;

-- Sample assessment "Acme Corp (sample)" — delete prior copy if any (cascades to children)
DELETE FROM "Assessment" WHERE "clientName" = 'Acme Corp (sample)';

INSERT INTO "Assessment" ("id", "clientName", "status", "deadline", "createdById", "createdAt", "updatedAt")
SELECT 'd1052ca8-459a-4174-aa7a-a07c212a1d39', 'Acme Corp (sample)', 'collecting', NOW() + INTERVAL '14 days', _seed_admin."id", NOW(), NOW()
FROM _seed_admin;

-- Departments
INSERT INTO "Department" ("id", "assessmentId", "name", "createdAt") VALUES
  ('68ef9226-46be-474a-9673-ceaaaa88a145', 'd1052ca8-459a-4174-aa7a-a07c212a1d39', 'Sales',       NOW()),
  ('d472df88-3642-402f-9300-f9b867c19d8f',   'd1052ca8-459a-4174-aa7a-a07c212a1d39', 'Engineering', NOW());

-- Respondents (5 total: 3 submitted, 1 in-progress, 1 fresh)
INSERT INTO "Respondent" ("id", "assessmentId", "code", "name", "departmentId", "level", "tenure", "startedAt", "submittedAt", "createdAt", "updatedAt") VALUES
  ('1b807cc0-331b-45ef-a47b-ced9dc5eb0e6', 'd1052ca8-459a-4174-aa7a-a07c212a1d39', 'JWYFDZ', 'Avery R.', '68ef9226-46be-474a-9673-ceaaaa88a145', 'manager', 'y4_7', NOW(), NOW(), NOW(), NOW()),
  ('eeea59bb-9967-4ef3-bece-f662c77d0301', 'd1052ca8-459a-4174-aa7a-a07c212a1d39', 'YX4G5P', 'Blake S.', '68ef9226-46be-474a-9673-ceaaaa88a145', 'senior_leader', 'y8_15', NOW(), NOW(), NOW(), NOW()),
  ('71358abb-09a1-4cb4-91b3-efe34af0fbb8', 'd1052ca8-459a-4174-aa7a-a07c212a1d39', 'UG5YSP', 'Casey T.', 'd472df88-3642-402f-9300-f9b867c19d8f', 'executive', 'gt_15y', NOW(), NOW(), NOW(), NOW()),
  ('e45705cb-250b-4ccf-86ea-c6deb218cdc2', 'd1052ca8-459a-4174-aa7a-a07c212a1d39', '4KSDK2', 'Drew V.', 'd472df88-3642-402f-9300-f9b867c19d8f', 'team_lead', 'y1_3', NOW(), NULL, NOW(), NOW()),
  ('df886356-b53c-4831-8c9f-14822fda4621', 'd1052ca8-459a-4174-aa7a-a07c212a1d39', 'WC3CTW', NULL, 'd472df88-3642-402f-9300-f9b867c19d8f', 'individual_contributor', 'lt_1y', NULL, NULL, NOW(), NOW());

-- Responses
-- Submitted respondents have all 30 answers; respondent #4 (Drew V.) has the first 28 answers (in-progress).
INSERT INTO "Response" ("id", "respondentId", "questionId", "value", "createdAt", "updatedAt") VALUES
  ('ef83726c-4484-47c7-81b6-4b6f650790c8', '1b807cc0-331b-45ef-a47b-ced9dc5eb0e6', '1a', 2, NOW(), NOW()),
  ('29d4b576-d4d1-469d-b3ef-b1b35682c77b', '1b807cc0-331b-45ef-a47b-ced9dc5eb0e6', '1b', 5, NOW(), NOW()),
  ('b7320113-02e5-46be-87b5-b6427fc831c1', '1b807cc0-331b-45ef-a47b-ced9dc5eb0e6', '2a', 4, NOW(), NOW()),
  ('204ad40f-8b28-454a-bba8-ac4fb6183ec8', '1b807cc0-331b-45ef-a47b-ced9dc5eb0e6', '2b', 3, NOW(), NOW()),
  ('f99749d2-b63f-4e8d-a82a-cf1fe9c9ce19', '1b807cc0-331b-45ef-a47b-ced9dc5eb0e6', '3a', 2, NOW(), NOW()),
  ('0cd055ed-9f50-497c-97fd-65452277e789', '1b807cc0-331b-45ef-a47b-ced9dc5eb0e6', '3b', 5, NOW(), NOW()),
  ('f67a547f-5f67-430e-93bc-8367a990a828', '1b807cc0-331b-45ef-a47b-ced9dc5eb0e6', '4a', 4, NOW(), NOW()),
  ('d55d451e-2a9e-4d46-a824-9ef9d0de4125', '1b807cc0-331b-45ef-a47b-ced9dc5eb0e6', '4b', 3, NOW(), NOW()),
  ('f5f6a14e-6ac1-41bb-bd73-f64d017ddfc7', '1b807cc0-331b-45ef-a47b-ced9dc5eb0e6', '5a', 2, NOW(), NOW()),
  ('3d9e9fad-b8d5-4c15-8f83-f1687038e45c', '1b807cc0-331b-45ef-a47b-ced9dc5eb0e6', '5b', 5, NOW(), NOW()),
  ('1023e9f2-9d23-49a0-8bf4-58a7fe246112', '1b807cc0-331b-45ef-a47b-ced9dc5eb0e6', '6a', 4, NOW(), NOW()),
  ('5ac2732b-17de-4e99-a361-0031632c3c5e', '1b807cc0-331b-45ef-a47b-ced9dc5eb0e6', '6b', 3, NOW(), NOW()),
  ('d4625d41-bb13-48a8-acb0-6d88a05cc795', '1b807cc0-331b-45ef-a47b-ced9dc5eb0e6', '7a', 2, NOW(), NOW()),
  ('480d4bdd-b38d-43b3-9c4d-f35bd9687b48', '1b807cc0-331b-45ef-a47b-ced9dc5eb0e6', '7b', 5, NOW(), NOW()),
  ('adc83d30-e06d-4fb6-a2a9-a8348983b41f', '1b807cc0-331b-45ef-a47b-ced9dc5eb0e6', '8a', 4, NOW(), NOW()),
  ('8147244d-87c9-40d1-bb9f-77a4e04226c4', '1b807cc0-331b-45ef-a47b-ced9dc5eb0e6', '8b', 3, NOW(), NOW()),
  ('d957d845-7a72-427b-8d89-8a8dae7d8c46', '1b807cc0-331b-45ef-a47b-ced9dc5eb0e6', '9a', 2, NOW(), NOW()),
  ('8d73e060-9baf-479a-a632-c15adcf1bcc4', '1b807cc0-331b-45ef-a47b-ced9dc5eb0e6', '9b', 5, NOW(), NOW()),
  ('75f4ce9c-679d-4323-aad8-5e7f8e027b66', '1b807cc0-331b-45ef-a47b-ced9dc5eb0e6', '10a', 4, NOW(), NOW()),
  ('1dea1405-7241-4b04-bcb1-4d7fa803d2c8', '1b807cc0-331b-45ef-a47b-ced9dc5eb0e6', '10b', 3, NOW(), NOW()),
  ('98346d10-394a-48cf-b631-e8445808d0d7', '1b807cc0-331b-45ef-a47b-ced9dc5eb0e6', '11a', 2, NOW(), NOW()),
  ('5977f28c-255a-4612-8222-f57212bfc1ed', '1b807cc0-331b-45ef-a47b-ced9dc5eb0e6', '11b', 5, NOW(), NOW()),
  ('95a2921a-4dba-4a98-969e-79bb004a9259', '1b807cc0-331b-45ef-a47b-ced9dc5eb0e6', '12a', 4, NOW(), NOW()),
  ('125b3bf3-1c08-4531-84b4-5e829fdc0551', '1b807cc0-331b-45ef-a47b-ced9dc5eb0e6', '12b', 3, NOW(), NOW()),
  ('6c64e440-a5d1-4d32-a2ef-d6464adb35fa', '1b807cc0-331b-45ef-a47b-ced9dc5eb0e6', '13a', 2, NOW(), NOW()),
  ('64ffad48-3fc0-4143-b661-003cc80628a8', '1b807cc0-331b-45ef-a47b-ced9dc5eb0e6', '13b', 5, NOW(), NOW()),
  ('b997bb25-a639-4f23-8f93-59c330cde11d', '1b807cc0-331b-45ef-a47b-ced9dc5eb0e6', '14a', 4, NOW(), NOW()),
  ('92430d53-9286-4573-89db-37984293f5dd', '1b807cc0-331b-45ef-a47b-ced9dc5eb0e6', '14b', 3, NOW(), NOW()),
  ('0efd203b-0d3f-422b-a7eb-a6c42ad89e70', '1b807cc0-331b-45ef-a47b-ced9dc5eb0e6', '15a', 2, NOW(), NOW()),
  ('7175cc24-fdb0-47aa-8441-0e73c0844648', '1b807cc0-331b-45ef-a47b-ced9dc5eb0e6', '15b', 5, NOW(), NOW()),
  ('c78dad7d-f676-4200-8d9d-f87eb0eb5ff5', 'eeea59bb-9967-4ef3-bece-f662c77d0301', '1a', 5, NOW(), NOW()),
  ('7b75d53f-c17e-4da8-8a83-4fb46088cfbf', 'eeea59bb-9967-4ef3-bece-f662c77d0301', '1b', 4, NOW(), NOW()),
  ('695008c1-4459-4ea2-9df9-3a655173589e', 'eeea59bb-9967-4ef3-bece-f662c77d0301', '2a', 3, NOW(), NOW()),
  ('b62493e7-8034-4103-b53e-4b752bb4a49b', 'eeea59bb-9967-4ef3-bece-f662c77d0301', '2b', 2, NOW(), NOW()),
  ('4bbf2293-9d70-4026-9b1a-b8a4c299f979', 'eeea59bb-9967-4ef3-bece-f662c77d0301', '3a', 5, NOW(), NOW()),
  ('ebbc59eb-fa5e-43d3-af29-485e60b3a1af', 'eeea59bb-9967-4ef3-bece-f662c77d0301', '3b', 4, NOW(), NOW()),
  ('6b26afd6-025e-46a0-bb35-7dd203ba583c', 'eeea59bb-9967-4ef3-bece-f662c77d0301', '4a', 3, NOW(), NOW()),
  ('731b7450-ac84-4498-8183-d98f1fb84789', 'eeea59bb-9967-4ef3-bece-f662c77d0301', '4b', 2, NOW(), NOW()),
  ('dccb00c4-9d49-434b-a8cd-836f4f910931', 'eeea59bb-9967-4ef3-bece-f662c77d0301', '5a', 5, NOW(), NOW()),
  ('c8627077-a858-4f24-a34a-da0f1eaace62', 'eeea59bb-9967-4ef3-bece-f662c77d0301', '5b', 4, NOW(), NOW()),
  ('a7c2281b-82ae-4dca-885e-c198567b870d', 'eeea59bb-9967-4ef3-bece-f662c77d0301', '6a', 3, NOW(), NOW()),
  ('1e9d70b7-f0b9-45eb-9018-dff5b8190d1d', 'eeea59bb-9967-4ef3-bece-f662c77d0301', '6b', 2, NOW(), NOW()),
  ('530ad7e4-4768-46d9-8513-548c074f86ea', 'eeea59bb-9967-4ef3-bece-f662c77d0301', '7a', 5, NOW(), NOW()),
  ('e2780efd-d248-4493-af5a-62389214a4bf', 'eeea59bb-9967-4ef3-bece-f662c77d0301', '7b', 4, NOW(), NOW()),
  ('7f138164-2eac-47bb-a001-9065f858c443', 'eeea59bb-9967-4ef3-bece-f662c77d0301', '8a', 3, NOW(), NOW()),
  ('2a943926-1e5f-43a0-9e32-b60dfc87d1df', 'eeea59bb-9967-4ef3-bece-f662c77d0301', '8b', 2, NOW(), NOW()),
  ('b9e4722d-bfb1-4637-9ac7-018b9134ff23', 'eeea59bb-9967-4ef3-bece-f662c77d0301', '9a', 5, NOW(), NOW()),
  ('81c613b3-abf2-4f0c-bb2b-6b439a7c6dc5', 'eeea59bb-9967-4ef3-bece-f662c77d0301', '9b', 4, NOW(), NOW()),
  ('7a943fb1-d165-4922-8f3b-d25a21ca589d', 'eeea59bb-9967-4ef3-bece-f662c77d0301', '10a', 3, NOW(), NOW()),
  ('c33cd6b7-10c6-4bde-81dc-ab8a8d39bbcf', 'eeea59bb-9967-4ef3-bece-f662c77d0301', '10b', 2, NOW(), NOW()),
  ('164e63ae-e3de-4b76-a4b9-389458486940', 'eeea59bb-9967-4ef3-bece-f662c77d0301', '11a', 5, NOW(), NOW()),
  ('5d80413e-1919-4c1e-a0c2-2f59ac6c13eb', 'eeea59bb-9967-4ef3-bece-f662c77d0301', '11b', 4, NOW(), NOW()),
  ('b1cd99fa-5655-4676-b86e-8b1d895df53d', 'eeea59bb-9967-4ef3-bece-f662c77d0301', '12a', 3, NOW(), NOW()),
  ('b2054392-ef12-43f0-8bba-09254d4de1a4', 'eeea59bb-9967-4ef3-bece-f662c77d0301', '12b', 2, NOW(), NOW()),
  ('7c972bab-ea6d-44fa-bd23-40c771ea3cce', 'eeea59bb-9967-4ef3-bece-f662c77d0301', '13a', 5, NOW(), NOW()),
  ('a9da4343-ed3f-44ba-a430-f91cffd4a018', 'eeea59bb-9967-4ef3-bece-f662c77d0301', '13b', 4, NOW(), NOW()),
  ('6a85d21a-eb53-41d3-89ce-349d40b11440', 'eeea59bb-9967-4ef3-bece-f662c77d0301', '14a', 3, NOW(), NOW()),
  ('c408d550-c508-4c55-9e3a-2ed69dca1904', 'eeea59bb-9967-4ef3-bece-f662c77d0301', '14b', 2, NOW(), NOW()),
  ('4c786e46-2b82-4e16-b42e-4ed311f33cd9', 'eeea59bb-9967-4ef3-bece-f662c77d0301', '15a', 5, NOW(), NOW()),
  ('a36ce129-2c85-4c8e-bd4a-31757df5b26c', 'eeea59bb-9967-4ef3-bece-f662c77d0301', '15b', 4, NOW(), NOW()),
  ('d423f039-eb05-4559-81de-56772aed9202', '71358abb-09a1-4cb4-91b3-efe34af0fbb8', '1a', 4, NOW(), NOW()),
  ('d01cf7c2-73a6-4972-a938-3f8a20ef3816', '71358abb-09a1-4cb4-91b3-efe34af0fbb8', '1b', 3, NOW(), NOW()),
  ('9cfacec3-ce3e-457b-9b5f-d6a464486123', '71358abb-09a1-4cb4-91b3-efe34af0fbb8', '2a', 2, NOW(), NOW()),
  ('68d60f13-5e71-4fa4-b854-9410081e235a', '71358abb-09a1-4cb4-91b3-efe34af0fbb8', '2b', 5, NOW(), NOW()),
  ('2461f64f-99e6-4006-bf51-59f1f22e2576', '71358abb-09a1-4cb4-91b3-efe34af0fbb8', '3a', 4, NOW(), NOW()),
  ('3ef2ee38-36c5-4a7a-8512-087f4d3cee5d', '71358abb-09a1-4cb4-91b3-efe34af0fbb8', '3b', 3, NOW(), NOW()),
  ('1adb3033-83d9-4eb8-a615-97f876213efc', '71358abb-09a1-4cb4-91b3-efe34af0fbb8', '4a', 2, NOW(), NOW()),
  ('817ec46e-8b87-490c-819d-04789f140f19', '71358abb-09a1-4cb4-91b3-efe34af0fbb8', '4b', 5, NOW(), NOW()),
  ('9bf13e22-fc97-4be8-bd45-34d9b71db5e1', '71358abb-09a1-4cb4-91b3-efe34af0fbb8', '5a', 4, NOW(), NOW()),
  ('70c1d7cd-180c-45e9-8775-160eb8ab8589', '71358abb-09a1-4cb4-91b3-efe34af0fbb8', '5b', 3, NOW(), NOW()),
  ('6ab8b172-2497-4793-a6d6-dd41e742a507', '71358abb-09a1-4cb4-91b3-efe34af0fbb8', '6a', 2, NOW(), NOW()),
  ('0bb5e59e-3150-447a-a17a-9d73e0da9a8f', '71358abb-09a1-4cb4-91b3-efe34af0fbb8', '6b', 5, NOW(), NOW()),
  ('26e3594f-56f9-4a65-bee1-b1f6583c976d', '71358abb-09a1-4cb4-91b3-efe34af0fbb8', '7a', 4, NOW(), NOW()),
  ('1d1803b6-aae5-415c-87f1-c7960ee98c5b', '71358abb-09a1-4cb4-91b3-efe34af0fbb8', '7b', 3, NOW(), NOW()),
  ('dddfbbf7-6dcd-4f10-a9ea-29e13a0c5c26', '71358abb-09a1-4cb4-91b3-efe34af0fbb8', '8a', 2, NOW(), NOW()),
  ('85b8c497-ec68-45cb-9952-03b41e0a1899', '71358abb-09a1-4cb4-91b3-efe34af0fbb8', '8b', 5, NOW(), NOW()),
  ('b3499910-f2ac-46eb-b4e0-ebf7c1b7ea7f', '71358abb-09a1-4cb4-91b3-efe34af0fbb8', '9a', 4, NOW(), NOW()),
  ('4eff62ed-4362-48a8-8d14-ddd0996c5f60', '71358abb-09a1-4cb4-91b3-efe34af0fbb8', '9b', 3, NOW(), NOW()),
  ('8bd311cd-ac1c-4c27-9b04-b04d4ab7f1f2', '71358abb-09a1-4cb4-91b3-efe34af0fbb8', '10a', 2, NOW(), NOW()),
  ('6ba058f1-74c2-48ee-8f51-fb40af9e3e13', '71358abb-09a1-4cb4-91b3-efe34af0fbb8', '10b', 5, NOW(), NOW()),
  ('58e37cc3-6037-4701-a691-a136b30faf7f', '71358abb-09a1-4cb4-91b3-efe34af0fbb8', '11a', 4, NOW(), NOW()),
  ('3a98411b-8f4a-4f96-a4bc-1898e0a3ac61', '71358abb-09a1-4cb4-91b3-efe34af0fbb8', '11b', 3, NOW(), NOW()),
  ('8a6607a1-5524-45e0-9d12-29b98fb30a53', '71358abb-09a1-4cb4-91b3-efe34af0fbb8', '12a', 2, NOW(), NOW()),
  ('5c3f5c31-31bc-4e09-a9eb-1354b3ca18e0', '71358abb-09a1-4cb4-91b3-efe34af0fbb8', '12b', 5, NOW(), NOW()),
  ('5e73d74c-8769-403e-9865-c10e70c29320', '71358abb-09a1-4cb4-91b3-efe34af0fbb8', '13a', 4, NOW(), NOW()),
  ('65796d9c-63b5-402e-bf93-51019111ba73', '71358abb-09a1-4cb4-91b3-efe34af0fbb8', '13b', 3, NOW(), NOW()),
  ('9798f879-f863-4b28-83f8-0fc0aaaf1b85', '71358abb-09a1-4cb4-91b3-efe34af0fbb8', '14a', 2, NOW(), NOW()),
  ('ce140962-3478-48cb-8fe7-e41ae7838a4d', '71358abb-09a1-4cb4-91b3-efe34af0fbb8', '14b', 5, NOW(), NOW()),
  ('3aaf5744-3e98-4908-bad3-0ab77dcd0415', '71358abb-09a1-4cb4-91b3-efe34af0fbb8', '15a', 4, NOW(), NOW()),
  ('7ebda7d1-d139-489c-839f-9ae4f53baa63', '71358abb-09a1-4cb4-91b3-efe34af0fbb8', '15b', 3, NOW(), NOW()),
  ('a84deb30-28f3-4c70-b1e8-d16a691e8c49', 'e45705cb-250b-4ccf-86ea-c6deb218cdc2', '1a', 3, NOW(), NOW()),
  ('a28f8cff-5509-4560-beb4-481545515d3d', 'e45705cb-250b-4ccf-86ea-c6deb218cdc2', '1b', 2, NOW(), NOW()),
  ('81e10fe7-878b-4792-b286-1032793b9a08', 'e45705cb-250b-4ccf-86ea-c6deb218cdc2', '2a', 5, NOW(), NOW()),
  ('e79322b8-e89d-4d97-97df-1229930a5d0c', 'e45705cb-250b-4ccf-86ea-c6deb218cdc2', '2b', 4, NOW(), NOW()),
  ('0ca1d17e-6050-4bc0-8da4-1b5927c8b31a', 'e45705cb-250b-4ccf-86ea-c6deb218cdc2', '3a', 3, NOW(), NOW()),
  ('f6bea9e0-7b7e-4b23-a6cc-d8ca93a58b4d', 'e45705cb-250b-4ccf-86ea-c6deb218cdc2', '3b', 2, NOW(), NOW()),
  ('462f0a94-d80c-4be2-a575-728368c9ddd4', 'e45705cb-250b-4ccf-86ea-c6deb218cdc2', '4a', 5, NOW(), NOW()),
  ('73c6a39f-4e9a-4025-97b9-bc19ec92d0c9', 'e45705cb-250b-4ccf-86ea-c6deb218cdc2', '4b', 4, NOW(), NOW()),
  ('f159f16a-00d0-4a85-8042-c6113628f3cd', 'e45705cb-250b-4ccf-86ea-c6deb218cdc2', '5a', 3, NOW(), NOW()),
  ('da67fd2c-cfc3-4e2a-b223-7154b55faada', 'e45705cb-250b-4ccf-86ea-c6deb218cdc2', '5b', 2, NOW(), NOW()),
  ('9c1eb49e-b79d-41d7-b074-16d0162a15ad', 'e45705cb-250b-4ccf-86ea-c6deb218cdc2', '6a', 5, NOW(), NOW()),
  ('da1006a1-0b96-498a-9750-c8d77aee6b04', 'e45705cb-250b-4ccf-86ea-c6deb218cdc2', '6b', 4, NOW(), NOW()),
  ('1c742cd6-55e8-4a77-8fcb-d81222655e33', 'e45705cb-250b-4ccf-86ea-c6deb218cdc2', '7a', 3, NOW(), NOW()),
  ('21f3a438-2d46-489e-9f97-143d0b441b2b', 'e45705cb-250b-4ccf-86ea-c6deb218cdc2', '7b', 2, NOW(), NOW());

COMMIT;

-- ────────────────────────────────────────────────────────────────
-- Done.
--
-- Sample super admin login (set via SEED_SUPER_ADMIN_* in seed.ts):
--   email:    superadmin@forefront.example
--   password: change-me-on-first-login
--
-- Reminder: change SEED_SUPER_ADMIN_PASSWORD in .env.local before any non-local use.
-- ────────────────────────────────────────────────────────────────
