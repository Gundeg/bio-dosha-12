import "server-only";
import path from "node:path";
import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import {
  CONDITION_OPTIONS,
  MENTAL_STATE_OPTIONS,
  POSITION_OPTIONS,
  PULSE_ROW_KEYS,
  PULSE_ROW_LABELS,
  SEASON_LABELS,
  SEX_LABELS,
  THERAPY_GROUPS,
  TREATMENT_MAX_SESSIONS,
} from "./clinicalConstants";
import { pulseTableSchema, type PulseTable } from "./apiSchemas";

const FONT_FAMILY = "NotoSans";
let fontsRegistered = false;

function ensureFonts() {
  if (fontsRegistered) return;
  const root = path.join(process.cwd(), "public", "fonts");
  Font.register({
    family: FONT_FAMILY,
    fonts: [
      { src: path.join(root, "NotoSans-Regular.ttf") },
      { src: path.join(root, "NotoSans-Bold.ttf"), fontWeight: "bold" },
    ],
  });
  fontsRegistered = true;
}

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    color: "#111",
  },
  h1: {
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  h2: {
    fontSize: 11,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 4,
  },
  field: {
    flexDirection: "row",
    marginBottom: 3,
    flexBasis: "50%",
    paddingRight: 8,
  },
  fieldFull: {
    flexDirection: "row",
    marginBottom: 3,
    flexBasis: "100%",
    paddingRight: 8,
  },
  label: {
    width: 130,
    color: "#444",
  },
  value: {
    flex: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: "#000",
    paddingBottom: 1,
  },
  pulseTable: {
    borderWidth: 0.5,
    borderColor: "#000",
    marginTop: 4,
  },
  pulseRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#000",
  },
  pulseRowLast: {
    flexDirection: "row",
  },
  pulseHeaderCell: {
    flex: 1,
    padding: 3,
    borderRightWidth: 0.5,
    borderRightColor: "#000",
    backgroundColor: "#eee",
    fontWeight: "bold",
    textAlign: "center",
  },
  pulseLabelCell: {
    width: 70,
    padding: 3,
    borderRightWidth: 0.5,
    borderRightColor: "#000",
    fontWeight: "bold",
  },
  pulseCell: {
    flex: 1,
    padding: 3,
    borderRightWidth: 0.5,
    borderRightColor: "#000",
    minHeight: 18,
  },
  pulseCellLast: {
    flex: 1,
    padding: 3,
    minHeight: 18,
  },
  smallNote: {
    color: "#444",
    marginTop: 6,
  },
  treatmentTable: {
    borderWidth: 0.5,
    borderColor: "#000",
    marginTop: 6,
  },
  treatmentHeader: {
    flexDirection: "row",
    backgroundColor: "#eee",
    borderBottomWidth: 0.5,
    borderBottomColor: "#000",
    padding: 3,
    fontWeight: "bold",
  },
  treatmentRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#000",
    padding: 3,
  },
  numCol: { width: 22, borderRightWidth: 0.5, borderRightColor: "#000", paddingRight: 3 },
  groupCol: { width: 80, borderRightWidth: 0.5, borderRightColor: "#000", paddingRight: 3 },
  leafCol: { width: 110, borderRightWidth: 0.5, borderRightColor: "#000", paddingRight: 3 },
  cellsCol: { flex: 1, flexDirection: "row" },
  cellBox: {
    width: 14,
    height: 14,
    marginRight: 1,
    borderWidth: 0.5,
    borderColor: "#000",
    textAlign: "center",
    fontSize: 7,
    paddingTop: 2,
  },
  cellBoxFilled: {
    width: 14,
    height: 14,
    marginRight: 1,
    borderWidth: 0.5,
    borderColor: "#000",
    backgroundColor: "#000",
    color: "#fff",
    textAlign: "center",
    fontSize: 7,
    paddingTop: 2,
  },
});

interface IntakeData {
  admissionDate: Date;
  dischargeDate: Date | null;
  season: "WINTER" | "SPRING" | "SUMMER" | "AUTUMN";
  weightKg: number;
  heightCm: number;
  tongue: string | null;
  pulseSummary: string | null;
  pulseTable: unknown;
  complaintAtArrival: string | null;
  condition: string | null;
  mentalState: string | null;
  position: string | null;
  zurkhai: string | null;
  diagnosis: string | null;
  treatmentPlan: string | null;
  covidHistory: string | null;
  surgeryHistory: string | null;
  chronicDisease: string | null;
  traumaHistory: string | null;
  bloodPressure: string | null;
  heartRate: string | null;
  complaintAtDischarge: string | null;
  recommendations: string | null;
  treatmentLog: Record<string, number> | null;
}

interface ProfileData {
  name: string;
  lastName: string | null;
  birthDate: Date;
  sex: "MALE" | "FEMALE";
  registerNumber: string | null;
  phone: string | null;
  address: string | null;
  occupation: string | null;
}

interface PdfProps {
  intake: IntakeData;
  profile: ProfileData;
  doctorName: string;
}

function formatDate(d: Date | null): string {
  if (!d) return "—";
  return d.toISOString().slice(0, 10);
}

function calcAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

function labelFor<T extends string>(
  options: ReadonlyArray<{ value: T; label: string }>,
  value: string | null
): string {
  if (!value) return "—";
  const found = options.find((o) => o.value === value);
  return found?.label ?? value;
}

function safePulse(value: unknown): PulseTable | null {
  const result = pulseTableSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function ClinicalIntakeDocument({ intake, profile, doctorName }: PdfProps) {
  ensureFonts();

  const pulse = safePulse(intake.pulseTable);

  return (
    <Document>
      {/* PAGE 1 — Intake */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Эмчлүүлэгчийн бүртгэлийн хуудас</Text>

        <View style={styles.row}>
          <Pair label="Овог" value={profile.lastName ?? "—"} />
          <Pair label="Нэр" value={profile.name} />
          <Pair label="Нас" value={`${calcAge(profile.birthDate)}`} />
          <Pair label="Хүйс" value={SEX_LABELS[profile.sex]} />
          <Pair label="Төрсөн жил" value={formatDate(profile.birthDate)} />
          <Pair label="Регистр" value={profile.registerNumber ?? "—"} />
          <Pair label="Утас" value={profile.phone ?? "—"} />
          <Pair label="Хаяг" value={profile.address ?? "—"} />
          <PairFull label="Мэргэжил, ажлын нөхцөл" value={profile.occupation ?? "—"} />
          <Pair label="Улирал" value={SEASON_LABELS[intake.season]} />
          <Pair label="Үзлэгт ирсэн өдөр" value={formatDate(intake.admissionDate)} />
          <Pair label="Биеийн жин (кг)" value={intake.weightKg.toString()} />
          <Pair label="Өндөр (см)" value={intake.heightCm.toString()} />
          <Pair label="Хэл" value={intake.tongue ?? "—"} />
          <Pair label="Судал (тайлбар)" value={intake.pulseSummary ?? "—"} />
        </View>

        <Text style={styles.h2}>Судасны үзлэг</Text>
        <View style={styles.pulseTable}>
          <View style={styles.pulseRow}>
            <Text style={styles.pulseLabelCell}> </Text>
            <Text style={styles.pulseHeaderCell}>Б — Дээр</Text>
            <Text style={styles.pulseHeaderCell}>Б — Доор</Text>
            <Text style={styles.pulseHeaderCell}>З — Дээр</Text>
            <Text style={[styles.pulseHeaderCell, { borderRightWidth: 0 }]}>З — Доор</Text>
          </View>
          {PULSE_ROW_KEYS.map((rowKey, rowIdx) => {
            const isLast = rowIdx === PULSE_ROW_KEYS.length - 1;
            const cell = pulse?.[rowKey];
            return (
              <View key={rowKey} style={isLast ? styles.pulseRowLast : styles.pulseRow}>
                <Text style={styles.pulseLabelCell}>{PULSE_ROW_LABELS[rowKey]}</Text>
                <Text style={styles.pulseCell}>{cell?.rightTop ?? ""}</Text>
                <Text style={styles.pulseCell}>{cell?.rightBottom ?? ""}</Text>
                <Text style={styles.pulseCell}>{cell?.leftTop ?? ""}</Text>
                <Text style={styles.pulseCellLast}>{cell?.leftBottom ?? ""}</Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.h2}>Эмнэл зүйн үнэлгээ</Text>
        <View style={styles.row}>
          <PairFull label="Ирэх үеийн зовиур" value={intake.complaintAtArrival ?? "—"} />
          <Pair label="Биеийн байдал" value={labelFor(CONDITION_OPTIONS, intake.condition)} />
          <Pair label="Ухаан санаа" value={labelFor(MENTAL_STATE_OPTIONS, intake.mentalState)} />
          <Pair label="Байрлал" value={labelFor(POSITION_OPTIONS, intake.position)} />
          <Pair label="Зурхай" value={intake.zurkhai ?? "—"} />
          <PairFull label="Онош" value={intake.diagnosis ?? "—"} />
          <PairFull label="Эмчилгээний төлөвлөгөө" value={intake.treatmentPlan ?? "—"} />
        </View>

        <Text style={styles.h2}>Нэмэлт мэдээлэл</Text>
        <View style={styles.row}>
          <Pair label="1. Ковид" value={intake.covidHistory ?? "—"} />
          <Pair label="2. Мэс засал" value={intake.surgeryHistory ?? "—"} />
          <Pair label="3. Архаг өвчин" value={intake.chronicDisease ?? "—"} />
          <Pair label="4. Гэмтэл" value={intake.traumaHistory ?? "—"} />
          <Pair label="5. Даралт" value={intake.bloodPressure ?? "—"} />
          <Pair label="Цохилтын тоо" value={intake.heartRate ?? "—"} />
        </View>

        <Text style={styles.h2}>Эмчилгээний төгсгөл</Text>
        <View style={styles.row}>
          <Pair label="Дууссан огноо" value={formatDate(intake.dischargeDate)} />
          <PairFull label="Гарах үеийн зовиур" value={intake.complaintAtDischarge ?? "—"} />
          <PairFull label="Зөвлөмж" value={intake.recommendations ?? "—"} />
        </View>

        <Text style={styles.smallNote}>Эмчлэгч эмч: {doctorName}</Text>
      </Page>

      {/* PAGE 2 — Treatment Log */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Эмчилгээ хуудас</Text>
        <View style={styles.row}>
          <Pair label="Овог, Нэр" value={`${profile.lastName ?? ""} ${profile.name}`.trim()} />
          <Pair label="Нас" value={`${calcAge(profile.birthDate)}`} />
          <Pair label="Эхэлсэн" value={formatDate(intake.admissionDate)} />
          <Pair label="Дууссан" value={formatDate(intake.dischargeDate)} />
        </View>

        <View style={styles.treatmentTable}>
          <View style={styles.treatmentHeader}>
            <Text style={styles.numCol}>№</Text>
            <Text style={styles.groupCol}>Эмчилгээ</Text>
            <Text style={styles.leafCol}>Хэсэг</Text>
            <Text style={styles.cellsCol}>Сесс</Text>
          </View>
          {THERAPY_GROUPS.flatMap((group) =>
            group.leaves.map((leaf, idx) => {
              const value = intake.treatmentLog?.[leaf.key] ?? 0;
              return (
                <View key={leaf.key} style={styles.treatmentRow}>
                  <Text style={styles.numCol}>{idx === 0 ? group.number : ""}</Text>
                  <Text style={styles.groupCol}>{idx === 0 ? group.label : ""}</Text>
                  <Text style={styles.leafCol}>
                    {group.leaves.length === 1 && leaf.label === group.label ? "" : leaf.label}
                  </Text>
                  <View style={styles.cellsCol}>
                    {Array.from({ length: TREATMENT_MAX_SESSIONS }, (_, i) => {
                      const filled = i + 1 <= value;
                      return (
                        <Text
                          key={i}
                          style={filled ? styles.cellBoxFilled : styles.cellBox}
                        >
                          {filled ? "✓" : ""}
                        </Text>
                      );
                    })}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </Page>
    </Document>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}:</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function PairFull({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fieldFull}>
      <Text style={styles.label}>{label}:</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}
