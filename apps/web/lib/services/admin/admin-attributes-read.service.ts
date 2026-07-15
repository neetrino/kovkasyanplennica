import { db } from "@white-shop/db";

class AdminAttributesReadService {
  /**
   * Get attributes
   */
  async getAttributes() {
    let attributes;

    try {
      attributes = await db.attribute.findMany({
        include: {
          translations: {
            where: { locale: "en" },
            take: 1,
          },
          values: {
            include: {
              translations: {
                where: { locale: "en" },
                take: 1,
              },
            },
            orderBy: {
              position: "asc",
            },
          },
        },
        orderBy: {
          position: "asc",
        },
      });
    } catch (error: any) {
      if (
        error?.code === 'P2022' ||
        error?.message?.includes('attribute_values.colors') ||
        error?.message?.includes('does not exist')
      ) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            '⚠️ [ADMIN ATTRIBUTES READ SERVICE] attribute_values.colors column not found, fetching without it:',
            error.message
          );
        }

        const attributesList = await db.attribute.findMany({
          include: {
            translations: {
              where: { locale: "en" },
              take: 1,
            },
          },
          orderBy: {
            position: "asc",
          },
        });

        let allValues: any[];
        try {
          allValues = await db.attributeValue.findMany({
            select: {
              id: true,
              attributeId: true,
              value: true,
              position: true,
              translations: {
                where: { locale: "en" },
                take: 1,
              },
            },
            orderBy: {
              position: "asc",
            },
          });
        } catch (selectError: any) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(
              '⚠️ [ADMIN ATTRIBUTES READ SERVICE] Using raw query for attribute values:',
              selectError.message
            );
          }
          try {
            allValues = await db.$queryRaw`
              SELECT 
                av.id,
                av."attributeId",
                av.value,
                av.position
              FROM attribute_values av
              ORDER BY av.position ASC
            ` as any[];
          } catch (rawError: any) {
            if (process.env.NODE_ENV === 'development') {
              console.warn(
                '⚠️ [ADMIN ATTRIBUTES READ SERVICE] Trying with snake_case column name:',
                rawError.message
              );
            }
            allValues = await db.$queryRaw`
              SELECT 
                av.id,
                av.attribute_id as "attributeId",
                av.value,
                av.position
              FROM attribute_values av
              ORDER BY av.position ASC
            ` as any[];
          }

          const valueIds = allValues.map((v: any) => v.id);
          const valueTranslations =
            valueIds.length > 0
              ? await db.attributeValueTranslation.findMany({
                  where: {
                    attributeValueId: { in: valueIds },
                    locale: "en",
                  },
                })
              : [];

          allValues = allValues.map((val: any) => ({
            ...val,
            translations: valueTranslations.filter((t: any) => t.attributeValueId === val.id),
          }));
        }

        attributes = attributesList.map((attr: any) => {
          const attrValues = allValues
            .filter((val: any) => val.attributeId === attr.id)
            .map((val: any) => ({
              id: val.id,
              attributeId: val.attributeId,
              value: val.value,
              position: val.position,
              colors: null,
              imageUrl: null,
              translations: Array.isArray(val.translations) ? val.translations : [],
            }));

          return {
            ...attr,
            values: attrValues,
          };
        });
      } else {
        throw error;
      }
    }

    const data = attributes.map(
      (attribute: {
        id: string;
        key: string;
        type: string;
        filterable: boolean;
        translations?: Array<{ name: string }>;
        values?: Array<{
          id: string;
          value: string;
          translations?: Array<{ label: string }>;
          colors?: unknown;
          imageUrl?: string | null;
        }>;
      }) => {
        const translations = Array.isArray(attribute.translations) ? attribute.translations : [];
        const translation = translations[0] || null;
        const values = Array.isArray(attribute.values) ? attribute.values : [];

        return {
          id: attribute.id,
          key: attribute.key,
          name: translation?.name || attribute.key,
          type: attribute.type,
          filterable: attribute.filterable,
          values: values.map((value: any) => {
            const valueTranslations = Array.isArray(value.translations) ? value.translations : [];
            const valueTranslation = valueTranslations[0] || null;
            const colorsData = value.colors;
            let colorsArray: string[] = [];

            if (colorsData) {
              if (Array.isArray(colorsData)) {
                colorsArray = colorsData;
              } else if (typeof colorsData === 'string') {
                try {
                  colorsArray = JSON.parse(colorsData);
                } catch {
                  colorsArray = [];
                }
              } else if (typeof colorsData === 'object') {
                colorsArray = Array.isArray(colorsData) ? colorsData : [];
              }
            }

            if (!Array.isArray(colorsArray)) {
              colorsArray = [];
            }

            return {
              id: value.id,
              value: value.value,
              label: valueTranslation?.label || value.value,
              colors: colorsArray,
              imageUrl: value.imageUrl || null,
            };
          }),
        };
      }
    );

    return { data };
  }
}

export const adminAttributesReadService = new AdminAttributesReadService();
