import { db } from "@white-shop/db";
import { ensureVacanciesTable } from "@/lib/utils/db-ensure";
import { normalizeVacancyImageUrlForStorage } from "@/lib/utils/vacancy-image-url";

/** Shape returned by Prisma for `vacancy` rows */
type VacancyRecord = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  salary: string | null;
  location: string | null;
  contactPhone: string | null;
  published: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
};

export interface VacancyRow {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  salary: string | null;
  location: string | null;
  contactPhone: string | null;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class AdminVacanciesService {
  private async ensureVacanciesReady(): Promise<void> {
    const ok = await ensureVacanciesTable();
    if (!ok) {
      throw {
        status: 503,
        type: "https://api.shop.am/problems/service-unavailable",
        title: "Service Unavailable",
        detail:
          "Vacancies table is missing or could not be created. Run: cd packages/db && npx prisma migrate deploy",
      };
    }
  }

  async listVacancies(): Promise<{ data: VacancyRow[] }> {
    await this.ensureVacanciesReady();
    const rows = await db.vacancy.findMany({
      where: { deletedAt: null },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    });
    return { data: rows.map((r: VacancyRecord) => this.mapRow(r)) };
  }

  async createVacancy(data: {
    title: string;
    description: string;
    imageUrl?: string | null;
    salary?: string | null;
    location?: string | null;
    contactPhone?: string | null;
    published?: boolean;
  }): Promise<{ data: VacancyRow }> {
    await this.ensureVacanciesReady();
    const created = await db.vacancy.create({
      data: {
        title: data.title.trim(),
        description: data.description.trim(),
        imageUrl: normalizeVacancyImageUrlForStorage(
          data.imageUrl === undefined ? null : data.imageUrl
        ),
        salary: data.salary?.trim() || null,
        location: data.location?.trim() || null,
        contactPhone: data.contactPhone?.trim() || null,
        published: data.published ?? true,
        position: 0,
      },
    });
    return { data: this.mapRow(created) };
  }

  async updateVacancy(
    id: string,
    data: {
      title?: string;
      description?: string;
      imageUrl?: string | null;
      salary?: string | null;
      location?: string | null;
      contactPhone?: string | null;
      published?: boolean;
    }
  ): Promise<{ data: VacancyRow }> {
    await this.ensureVacanciesReady();
    const existing = await db.vacancy.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Not found",
        detail: `Vacancy with id '${id}' does not exist`,
      };
    }

    const updated = await db.vacancy.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title.trim() } : {}),
        ...(data.description !== undefined ? { description: data.description.trim() } : {}),
        ...(data.imageUrl !== undefined
          ? {
              imageUrl: normalizeVacancyImageUrlForStorage(data.imageUrl),
            }
          : {}),
        ...(data.salary !== undefined ? { salary: data.salary?.trim() || null } : {}),
        ...(data.location !== undefined ? { location: data.location?.trim() || null } : {}),
        ...(data.contactPhone !== undefined
          ? { contactPhone: data.contactPhone?.trim() || null }
          : {}),
        ...(data.published !== undefined ? { published: data.published } : {}),
      },
    });
    return { data: this.mapRow(updated) };
  }

  async deleteVacancy(id: string): Promise<{ success: true }> {
    await this.ensureVacanciesReady();
    const existing = await db.vacancy.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Not found",
        detail: `Vacancy with id '${id}' does not exist`,
      };
    }
    await db.vacancy.update({
      where: { id },
      data: { deletedAt: new Date(), published: false },
    });
    return { success: true };
  }

  /** Published vacancies for public storefront */
  async listPublishedVacancies(): Promise<{ data: VacancyRow[] }> {
    await this.ensureVacanciesReady();
    const rows = await db.vacancy.findMany({
      where: { deletedAt: null, published: true },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    });
    return { data: rows.map((r: VacancyRecord) => this.mapRow(r)) };
  }

  private mapRow(r: VacancyRecord): VacancyRow {
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      imageUrl: r.imageUrl,
      salary: r.salary,
      location: r.location,
      contactPhone: r.contactPhone,
      published: r.published,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }
}

export const adminVacanciesService = new AdminVacanciesService();
