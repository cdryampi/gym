function mapHeaderAlias(header: string): string {
  const h = header
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[\s_-]+/g, "");

  if (/^(email|correo|mail|emailaddress|direcciondecorreo)$/.test(h)) return "email";
  if (/^(firstname|nombre|nombres|name|primernombre)$/.test(h)) return "first_name";
  if (/^(lastname|apellido|apellidos|lastnames)$/.test(h)) return "last_name";
  if (/^(phone|telefono|celular|tel|movil|nrocelular)$/.test(h)) return "phone";
  if (/^(membershipplan|plan|membresia|tipodemembresia|planslug)$/.test(h)) return "membership_plan";
  if (/^(membershipstartdate|fechainicio|inicio|startdate|f_inicio)$/.test(h)) return "membership_start_date";
  if (/^(membershipenddate|fechafin|fin|vencimiento|enddate|f_fin)$/.test(h)) return "membership_end_date";
  if (/^(status|estado)$/.test(h)) return "status";
  if (/^(documentid|dni|documento|cedula|doc|nrodocumento)$/.test(h)) return "document_id";
  if (/^(birthdate|fechanacimiento|nacimiento|f_nacimiento)$/.test(h)) return "birth_date";
  if (/^(address|direccion|domicilio)$/.test(h)) return "address";
  if (/^(emergencycontactname|contactoemergencia|nombreemergencia|emergencianombre|contacto)$/.test(h)) return "emergency_contact_name";
  if (/^(emergencycontactphone|telefonoemergencia|emergenciatelefono|contacto_telefono)$/.test(h)) return "emergency_contact_phone";
  if (/^(notes|notas|observaciones|comentarios|nota)$/.test(h)) return "notes";
  if (/^(sendwelcomeemail|bienvenida|enviarbienvenida|correo_bienvenida|welcome)$/.test(h)) return "send_welcome_email";

  return header;
}

export function parseCsv(raw: string): Record<string, string>[] {
  if (!raw || !raw.trim()) return [];

  const lines: string[] = [];
  let currentLine = "";
  let inQuotes = false;

  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      currentLine += char;
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = "";
      if (char === "\r" && raw[i + 1] === "\n") {
        i++;
      }
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  if (lines.length === 0) return [];

  // Detect delimiter (comma or semicolon) from headers
  const firstLine = lines[0];
  let delimiter = ",";
  const commas = (firstLine.match(/,/g) || []).length;
  const semicolons = (firstLine.match(/;/g) || []).length;
  if (semicolons > commas) {
    delimiter = ";";
  }

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let currentField = "";
    let lineQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        lineQuotes = !lineQuotes;
      } else if (char === delimiter && !lineQuotes) {
        result.push(currentField.trim());
        currentField = "";
      } else {
        currentField += char;
      }
    }
    result.push(currentField.trim());
    return result;
  };

  const rawHeaders = parseLine(lines[0]);
  const mappedHeaders = rawHeaders.map((h) => mapHeaderAlias(h));

  const records: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseLine(lines[i]);
    const record: Record<string, string> = {};
    let hasValues = false;

    for (let j = 0; j < mappedHeaders.length; j++) {
      const key = mappedHeaders[j];
      const val = fields[j] || "";
      if (val) hasValues = true;
      record[key] = val;
    }

    if (hasValues) {
      records.push(record);
    }
  }

  return records;
}
export type ParseCsvType = typeof parseCsv;
