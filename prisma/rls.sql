-- ─────────────────────────────────────────────────────────────
-- GymApp — Row-Level Security (RLS)
-- Ejecutar después de `prisma migrate deploy`
-- ─────────────────────────────────────────────────────────────

-- Habilitar RLS en todas las tablas con gymId
ALTER TABLE "Member"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Trainer"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MembershipPlan"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AccessLog"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Exercise"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Routine"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RoutineExercise"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RoutineAssignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClassSchedule"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClassBooking"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChurnScore"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PushToken"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GymSeat"          ENABLE ROW LEVEL SECURITY;

-- Crear rol de aplicación (Prisma se conecta como este rol)
DO $$ BEGIN
  CREATE ROLE gymapp_app LOGIN PASSWORD 'CHANGE_IN_PRODUCTION';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Política: el rol de app solo ve registros de su propio gymId
-- El gymId se pasa como setting de sesión: SET app.current_gym_id = 'xxx'

CREATE POLICY gym_isolation ON "Member"
  USING ("gymId" = current_setting('app.current_gym_id', true));

CREATE POLICY gym_isolation ON "Trainer"
  USING ("gymId" = current_setting('app.current_gym_id', true));

CREATE POLICY gym_isolation ON "MembershipPlan"
  USING ("gymId" = current_setting('app.current_gym_id', true));

CREATE POLICY gym_isolation ON "Payment"
  USING ("gymId" = current_setting('app.current_gym_id', true));

CREATE POLICY gym_isolation ON "AccessLog"
  USING ("gymId" = current_setting('app.current_gym_id', true));

CREATE POLICY gym_isolation ON "Routine"
  USING ("gymId" = current_setting('app.current_gym_id', true));

CREATE POLICY gym_isolation ON "RoutineAssignment"
  USING ("gymId" = current_setting('app.current_gym_id', true));

CREATE POLICY gym_isolation ON "ClassSchedule"
  USING ("gymId" = current_setting('app.current_gym_id', true));

CREATE POLICY gym_isolation ON "ClassBooking"
  USING ("gymId" = current_setting('app.current_gym_id', true));

CREATE POLICY gym_isolation ON "ChurnScore"
  USING ("gymId" = current_setting('app.current_gym_id', true));

CREATE POLICY gym_isolation ON "PushToken"
  USING ("gymId" = current_setting('app.current_gym_id', true));

CREATE POLICY gym_isolation ON "GymSeat"
  USING ("gymId" = current_setting('app.current_gym_id', true));

-- Exercise: ver los del gym propio + los públicos (biblioteca global)
CREATE POLICY gym_isolation ON "Exercise"
  USING ("gymId" = current_setting('app.current_gym_id', true) OR "isPublic" = true);

-- Grants al rol de aplicación
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO gymapp_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO gymapp_app;
