// src/utils/dateUtils.ts
import { format, isSameDay } from "date-fns";
import { gu } from "date-fns/locale";

export const formatDate = (date: Date, formatStr: string, language: string) => {
  return format(date, formatStr, {
    locale: language === "gu" ? gu : undefined,
  });
};
