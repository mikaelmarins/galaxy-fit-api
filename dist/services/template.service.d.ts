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
    recommendedWeeks?: number;
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
/**
 * Lista todos os treinos do usuário (resumo)
 */
export declare function getUserTemplates(userId: string): Promise<TemplateSummary[]>;
/**
 * Retorna o treino ativo do usuário com todos os detalhes
 */
export declare function getActiveTemplate(userId: string): Promise<TemplateDetail | null>;
/**
 * Retorna um treino específico por ID
 */
export declare function getTemplateById(id: string, userId: string): Promise<TemplateDetail | null>;
/**
 * Cria um novo treino
 */
export declare function createTemplate(userId: string, input: CreateTemplateInput): Promise<TemplateDetail>;
/**
 * Atualiza um treino existente
 */
export declare function updateTemplate(id: string, userId: string, input: CreateTemplateInput): Promise<TemplateDetail | null>;
/**
 * Ativa um treino (desativa os outros)
 */
export declare function activateTemplate(id: string, userId: string): Promise<boolean>;
/**
 * Exclui um treino
 */
export declare function deleteTemplate(id: string, userId: string): Promise<boolean>;
export {};
//# sourceMappingURL=template.service.d.ts.map