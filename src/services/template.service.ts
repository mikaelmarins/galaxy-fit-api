import { getConnection } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// TIPOS
// ============================================

interface WorkoutSet {
    reps: string;
    weight?: number;
    rpe?: number;
    notes?: string;
    isWarmup?: boolean;
}

interface WorkoutExercise {
    name: string;
    type?: 'strength' | 'cardio';
    description?: string;
    notes?: string;
    restSeconds?: number;
    isStandardSets?: boolean;
    sets: WorkoutSet[];
    cardio?: {
        durationMinutes: number;
        intensity: string;
    };
}

interface CardioSession {
    modality: string;
    durationMinutes: number;
    intensity: string;
    notes?: string;
}

interface WorkoutDay {
    title: string;
    dayOfWeek?: number;
    exercises: WorkoutExercise[];
    cardio?: CardioSession;
}

interface CreateTemplateInput {
    title: string;
    description?: string;
    days: WorkoutDay[];
    recommendedWeeks?: number; // Tempo recomendado de uso em semanas
}

interface TemplateSummary {
    id: string;
    title: string;
    description: string | null;
    isActive: boolean;
    daysCount: number;
    exercisesCount: number;
    createdAt: Date;
    updatedAt: Date;
}

interface TemplateDetail {
    id: string;
    title: string;
    description: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    activatedAt: Date | null;
    recommendedWeeks: number;
    days: any[];
}

// ============================================
// FUNÇÕES DE SERVIÇO
// ============================================

/**
 * Lista todos os treinos do usuário (resumo)
 */
export async function getUserTemplates(userId: string): Promise<TemplateSummary[]> {
    const connection = await getConnection();

    try {
        const result = await connection.execute(
            `SELECT 
        t.ID,
        t.TITLE,
        t.DESCRIPTION,
        t.IS_ACTIVE,
        t.CREATED_AT,
        t.UPDATED_AT,
        (SELECT COUNT(*) FROM WORKOUT_DAYS d WHERE d.TEMPLATE_ID = t.ID) as DAYS_COUNT,
        (SELECT COUNT(*) FROM WORKOUT_DAYS d 
         JOIN WORKOUT_EXERCISES e ON e.DAY_ID = d.ID 
         WHERE d.TEMPLATE_ID = t.ID) as EXERCISES_COUNT
       FROM WORKOUT_TEMPLATES t
       WHERE t.USER_ID = :userId
       ORDER BY t.IS_ACTIVE DESC, t.UPDATED_AT DESC`,
            { userId },
            { outFormat: 4002 } // OUT_FORMAT_OBJECT
        );

        return (result.rows || []).map((row: any) => ({
            id: row.ID,
            title: row.TITLE,
            description: row.DESCRIPTION,
            isActive: row.IS_ACTIVE === 1,
            daysCount: row.DAYS_COUNT || 0,
            exercisesCount: row.EXERCISES_COUNT || 0,
            createdAt: row.CREATED_AT,
            updatedAt: row.UPDATED_AT
        }));
    } finally {
        await connection.close();
    }
}

/**
 * Retorna o treino ativo do usuário com todos os detalhes
 */
export async function getActiveTemplate(userId: string): Promise<TemplateDetail | null> {
    const connection = await getConnection();

    try {
        // Usar SELECT * para compatibilidade com schemas antigos/novos
        const templateResult = await connection.execute(
            `SELECT * FROM WORKOUT_TEMPLATES
       WHERE USER_ID = :userId AND IS_ACTIVE = 1`,
            { userId },
            { outFormat: 4002 }
        );

        const templates = templateResult.rows as any[];
        if (!templates || templates.length === 0) {
            return null;
        }

        const template = templates[0];
        return await getTemplateWithDetailsInternal(connection, template);
    } finally {
        await connection.close();
    }
}

/**
 * Retorna um treino específico por ID
 */
export async function getTemplateById(id: string, userId: string): Promise<TemplateDetail | null> {
    const connection = await getConnection();

    try {
        // Usar SELECT * para compatibilidade
        const templateResult = await connection.execute(
            `SELECT * FROM WORKOUT_TEMPLATES
       WHERE ID = :id AND USER_ID = :userId`,
            { id, userId },
            { outFormat: 4002 }
        );

        const templates = templateResult.rows as any[];
        if (!templates || templates.length === 0) {
            return null;
        }

        const template = templates[0];
        return await getTemplateWithDetailsInternal(connection, template);
    } finally {
        await connection.close();
    }
}

/**
 * Busca detalhes completos de um template (dias, exercícios, séries)
 */
async function getTemplateWithDetailsInternal(connection: any, template: any): Promise<TemplateDetail> {
    const daysResult = await connection.execute(
        `SELECT ID, TITLE, DAY_ORDER, DAY_OF_WEEK, CARDIO_DATA
     FROM WORKOUT_DAYS
     WHERE TEMPLATE_ID = :templateId
     ORDER BY DAY_ORDER`,
        { templateId: template.ID },
        { outFormat: 4002 }
    );

    const days = [];
    for (const day of (daysResult.rows || []) as any[]) {
        const exercisesResult = await connection.execute(
            `SELECT ID, NAME, DESCRIPTION, NOTES, REST_SECONDS, EXERCISE_ORDER, IS_STANDARD_SETS, SETS_DATA, EXERCISE_TYPE, CARDIO_DATA
       FROM WORKOUT_EXERCISES
       WHERE DAY_ID = :dayId
       ORDER BY EXERCISE_ORDER`,
            { dayId: day.ID },
            { outFormat: 4002 }
        );

        const exercises = (exercisesResult.rows || []).map((ex: any) => ({
            id: ex.ID,
            name: ex.NAME,
            type: ex.EXERCISE_TYPE || 'strength',
            description: ex.DESCRIPTION,
            notes: ex.NOTES,
            restSeconds: ex.REST_SECONDS || 90,
            isStandardSets: ex.IS_STANDARD_SETS === 1,
            sets: ex.SETS_DATA ? JSON.parse(ex.SETS_DATA) : [],
            cardio: ex.CARDIO_DATA ? JSON.parse(ex.CARDIO_DATA) : undefined
        }));

        days.push({
            id: day.ID,
            title: day.TITLE,
            dayOrder: day.DAY_ORDER,
            dayOfWeek: day.DAY_OF_WEEK,
            cardio: day.CARDIO_DATA ? JSON.parse(day.CARDIO_DATA) : null,
            exercises
        });
    }

    return {
        id: template.ID,
        title: template.TITLE,
        description: template.DESCRIPTION,
        isActive: template.IS_ACTIVE === 1,
        createdAt: template.CREATED_AT,
        updatedAt: template.UPDATED_AT,
        activatedAt: template.ACTIVATED_AT || null,
        recommendedWeeks: template.RECOMMENDED_WEEKS || 8,
        days
    };
}

/**
 * Cria um novo treino
 */
export async function createTemplate(userId: string, input: CreateTemplateInput): Promise<TemplateDetail> {
    const connection = await getConnection();

    try {
        const templateId = uuidv4();
        const now = new Date();

        console.log('[Templates] Creating template for user:', userId);
        console.log('[Templates] Input:', JSON.stringify(input, null, 2));

        const tplData = {
            id: templateId,
            userId: userId,
            title: String(input.title),
            description: String(input.description || ''),
            createdAt: now,
            updatedAt: now
        };
        console.log('[Templates] Template data:', JSON.stringify(tplData, null, 2));

        // Inserir template (tenta com RECOMMENDED_WEEKS, fallback sem)
        try {
            await connection.execute(
                `INSERT INTO WORKOUT_TEMPLATES (ID, USER_ID, TITLE, DESCRIPTION, IS_ACTIVE, CREATED_AT, UPDATED_AT, RECOMMENDED_WEEKS)
       VALUES (:id, :userId, :title, :description, 0, :createdAt, :updatedAt, :recommendedWeeks)`,
                { ...tplData, recommendedWeeks: input.recommendedWeeks || 8 },
                { autoCommit: false }
            );
        } catch (colErr: any) {
            // Se a coluna não existe, usar query sem RECOMMENDED_WEEKS
            if (colErr.message?.includes('RECOMMENDED_WEEKS')) {
                console.log('[Templates] Column RECOMMENDED_WEEKS not found, using fallback query');
                await connection.execute(
                    `INSERT INTO WORKOUT_TEMPLATES (ID, USER_ID, TITLE, DESCRIPTION, IS_ACTIVE, CREATED_AT, UPDATED_AT)
       VALUES (:id, :userId, :title, :description, 0, :createdAt, :updatedAt)`,
                    tplData,
                    { autoCommit: false }
                );
            } else {
                throw colErr;
            }
        }
        console.log('[Templates] Template inserted successfully');

        // Inserir dias e exercícios
        for (let i = 0; i < input.days.length; i++) {
            const day = input.days[i];
            const dayId = uuidv4();

            const dayData = {
                id: dayId,
                templateId: templateId,
                title: String(day.title),
                dayOrder: Number(i),
                dayOfWeek: typeof day.dayOfWeek === 'number' ? day.dayOfWeek : null,
                cardioData: day.cardio ? JSON.stringify(day.cardio) : null
            };
            console.log('[Templates] Day data:', JSON.stringify(dayData, null, 2));

            await connection.execute(
                `INSERT INTO WORKOUT_DAYS (ID, TEMPLATE_ID, TITLE, DAY_ORDER, DAY_OF_WEEK, CARDIO_DATA)
         VALUES (:id, :templateId, :title, :dayOrder, :dayOfWeek, :cardioData)`,
                dayData,
                { autoCommit: false }
            );

            for (let j = 0; j < day.exercises.length; j++) {
                const ex = day.exercises[j];
                const exId = uuidv4();

                const exData = {
                    id: exId,
                    dayId: dayId,
                    name: String(ex.name || 'Exercício'),
                    description: String(ex.description || ''),
                    notes: String(ex.notes || ''),
                    restSeconds: Number(ex.restSeconds) || 90,
                    exerciseOrder: Number(j),
                    isStandardSets: ex.isStandardSets !== false ? 1 : 0,
                    setsData: JSON.stringify(ex.sets || []),
                    exerciseType: String(ex.type || 'strength'),
                    cardioData: ex.cardio ? JSON.stringify(ex.cardio) : ''
                };
                console.log('[Templates] Exercise data:', JSON.stringify(exData, null, 2));

                await connection.execute(
                    `INSERT INTO WORKOUT_EXERCISES 
           (ID, DAY_ID, NAME, DESCRIPTION, NOTES, REST_SECONDS, EXERCISE_ORDER, IS_STANDARD_SETS, SETS_DATA, EXERCISE_TYPE, CARDIO_DATA)
           VALUES (:id, :dayId, :name, :description, :notes, :restSeconds, :exerciseOrder, :isStandardSets, :setsData, :exerciseType, :cardioData)`,
                    exData,
                    { autoCommit: false }
                );
            }
        }

        // Commit all changes
        await connection.execute('COMMIT');

        // Return the created template
        return (await getTemplateById(templateId, userId))!;
    } catch (error) {
        await connection.execute('ROLLBACK');
        throw error;
    } finally {
        await connection.close();
    }
}

/**
 * Atualiza um treino existente
 */
export async function updateTemplate(id: string, userId: string, input: CreateTemplateInput): Promise<TemplateDetail | null> {
    // Verificar se existe
    const existing = await getTemplateById(id, userId);
    if (!existing) return null;

    const connection = await getConnection();

    try {
        const now = new Date();

        // Atualizar template
        await connection.execute(
            `UPDATE WORKOUT_TEMPLATES 
       SET TITLE = :title, DESCRIPTION = :description, UPDATED_AT = :updatedAt
       WHERE ID = :id AND USER_ID = :userId`,
            {
                id,
                userId,
                title: input.title,
                description: input.description || null,
                updatedAt: now
            },
            { autoCommit: false }
        );

        // Deletar dias antigos (cascade deleta exercícios)
        await connection.execute(
            `DELETE FROM WORKOUT_DAYS WHERE TEMPLATE_ID = :templateId`,
            { templateId: id },
            { autoCommit: false }
        );

        // Inserir novos dias
        for (let i = 0; i < input.days.length; i++) {
            const day = input.days[i];
            const dayId = uuidv4();

            await connection.execute(
                `INSERT INTO WORKOUT_DAYS (ID, TEMPLATE_ID, TITLE, DAY_ORDER, DAY_OF_WEEK, CARDIO_DATA)
         VALUES (:id, :templateId, :title, :dayOrder, :dayOfWeek, :cardioData)`,
                {
                    id: dayId,
                    templateId: id,
                    title: day.title,
                    dayOrder: i,
                    dayOfWeek: day.dayOfWeek ?? -1,
                    cardioData: day.cardio ? JSON.stringify(day.cardio) : ''
                },
                { autoCommit: false }
            );

            for (let j = 0; j < day.exercises.length; j++) {
                const ex = day.exercises[j];
                const exId = uuidv4();

                await connection.execute(
                    `INSERT INTO WORKOUT_EXERCISES 
           (ID, DAY_ID, NAME, DESCRIPTION, NOTES, REST_SECONDS, EXERCISE_ORDER, IS_STANDARD_SETS, SETS_DATA, EXERCISE_TYPE, CARDIO_DATA)
           VALUES (:id, :dayId, :name, :description, :notes, :restSeconds, :exerciseOrder, :isStandardSets, :setsData, :exerciseType, :cardioData)`,
                    {
                        id: exId,
                        dayId,
                        name: ex.name,
                        description: ex.description || '',
                        notes: ex.notes || '',
                        restSeconds: ex.restSeconds || 90,
                        exerciseOrder: j,
                        isStandardSets: ex.isStandardSets !== false ? 1 : 0,
                        setsData: JSON.stringify(ex.sets || []),
                        exerciseType: ex.type || 'strength',
                        cardioData: ex.cardio ? JSON.stringify(ex.cardio) : ''
                    },
                    { autoCommit: false }
                );
            }
        }

        await connection.execute('COMMIT');

        return await getTemplateById(id, userId);
    } catch (error) {
        await connection.execute('ROLLBACK');
        throw error;
    } finally {
        await connection.close();
    }
}

/**
 * Ativa um treino (desativa os outros)
 */
export async function activateTemplate(id: string, userId: string): Promise<boolean> {
    console.log('[Templates] activateTemplate called with id:', id, 'userId:', userId);

    if (!id || !userId) {
        console.log('[Templates] Missing id or userId');
        return false;
    }

    const connection = await getConnection();

    try {
        // Usar uma única query para evitar deadlock
        // Atualiza IS_ACTIVE para 1 apenas se ID = id, caso contrário 0
        console.log('[Templates] Updating templates with single query...');

        // Tentar com ACTIVATED_AT primeiro, fallback sem ela
        let result;
        try {
            result = await connection.execute(
                `UPDATE WORKOUT_TEMPLATES 
                 SET IS_ACTIVE = CASE WHEN ID = :id THEN 1 ELSE 0 END,
                     UPDATED_AT = CASE WHEN ID = :id THEN :now ELSE UPDATED_AT END,
                     ACTIVATED_AT = CASE WHEN ID = :id AND (ACTIVATED_AT IS NULL OR IS_ACTIVE = 0) THEN :now ELSE ACTIVATED_AT END
                 WHERE USER_ID = :userId`,
                { id, userId, now: new Date() },
                { autoCommit: true }
            );
        } catch (colErr: any) {
            // Se ACTIVATED_AT não existe, usar query sem ela
            if (colErr.errorNum === 904) {
                console.log('[Templates] ACTIVATED_AT column not found, using fallback query');
                result = await connection.execute(
                    `UPDATE WORKOUT_TEMPLATES 
                     SET IS_ACTIVE = CASE WHEN ID = :id THEN 1 ELSE 0 END,
                         UPDATED_AT = CASE WHEN ID = :id THEN :now ELSE UPDATED_AT END
                     WHERE USER_ID = :userId`,
                    { id, userId, now: new Date() },
                    { autoCommit: true }
                );
            } else {
                throw colErr;
            }
        }

        console.log('[Templates] Rows affected:', (result as any).rowsAffected);

        // Verificar se o template específico foi atualizado
        const checkResult = await connection.execute(
            `SELECT IS_ACTIVE FROM WORKOUT_TEMPLATES WHERE ID = :id AND USER_ID = :userId`,
            { id, userId },
            { outFormat: 4002 }
        );

        const rows = checkResult.rows as any[];
        const activated = rows && rows.length > 0 && rows[0].IS_ACTIVE === 1;
        console.log('[Templates] Template activated:', activated);

        return activated;
    } catch (error) {
        console.error('[Templates] Error in activateTemplate:', error);
        throw error;
    } finally {
        await connection.close();
    }
}

/**
 * Exclui um treino
 */
export async function deleteTemplate(id: string, userId: string): Promise<boolean> {
    const connection = await getConnection();

    try {
        const result = await connection.execute(
            `DELETE FROM WORKOUT_TEMPLATES WHERE ID = :id AND USER_ID = :userId`,
            { id, userId },
            { autoCommit: true }
        );

        return (result as any).rowsAffected > 0;
    } finally {
        await connection.close();
    }
}
