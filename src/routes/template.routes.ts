import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as templateService from '../services/template.service';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

/**
 * GET /templates
 * Lista todos os treinos do usuário
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const templates = await templateService.getUserTemplates(userId);

        res.json({
            success: true,
            data: templates
        });
    } catch (error) {
        console.error('[Templates] Error listing:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao listar treinos'
        });
    }
});

/**
 * GET /templates/active
 * Retorna o treino ativo do usuário
 */
router.get('/active', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const template = await templateService.getActiveTemplate(userId);

        if (!template) {
            return res.json({
                success: true,
                data: null,
                message: 'Nenhum treino ativo'
            });
        }

        res.json({
            success: true,
            data: template
        });
    } catch (error) {
        console.error('[Templates] Error getting active:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar treino ativo'
        });
    }
});

/**
 * GET /templates/:id
 * Retorna detalhes de um treino específico
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { id } = req.params;

        const template = await templateService.getTemplateById(id, userId);

        if (!template) {
            return res.status(404).json({
                success: false,
                error: 'Treino não encontrado'
            });
        }

        res.json({
            success: true,
            data: template
        });
    } catch (error) {
        console.error('[Templates] Error getting by id:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar treino'
        });
    }
});

/**
 * POST /templates
 * Cria um novo treino
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { title, description, days } = req.body;

        console.log('[Route Templates] POST / received');
        console.log('[Route Templates] userId:', userId);
        console.log('[Route Templates] body:', JSON.stringify(req.body, null, 2));

        if (!title || !days || !Array.isArray(days)) {
            return res.status(400).json({
                success: false,
                error: 'Título e dias são obrigatórios'
            });
        }

        console.log('[Route Templates] Calling createTemplate...');
        const template = await templateService.createTemplate(userId, {
            title,
            description,
            days
        });

        res.status(201).json({
            success: true,
            data: template,
            message: 'Treino criado com sucesso'
        });
    } catch (error: any) {
        console.error('[Templates] Error creating:', error);
        console.error('[Templates] Error message:', error.message);
        console.error('[Templates] Error code:', error.code);
        console.error('[Templates] Error offset:', error.offset);
        res.status(500).json({
            success: false,
            error: 'Erro ao criar treino',
            details: error.message
        });
    }
});

/**
 * PUT /templates/:id
 * Atualiza um treino existente
 */
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { id } = req.params;
        const { title, description, days } = req.body;

        const template = await templateService.updateTemplate(id, userId, {
            title,
            description,
            days
        });

        if (!template) {
            return res.status(404).json({
                success: false,
                error: 'Treino não encontrado'
            });
        }

        res.json({
            success: true,
            data: template,
            message: 'Treino atualizado com sucesso'
        });
    } catch (error) {
        console.error('[Templates] Error updating:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao atualizar treino'
        });
    }
});

/**
 * PUT /templates/:id/activate
 * Define um treino como ativo
 */
router.put('/:id/activate', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { id } = req.params;

        console.log('[Templates] Activating template:', id, 'for user:', userId);

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Usuário não autenticado'
            });
        }

        const success = await templateService.activateTemplate(id, userId);

        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Treino não encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Treino ativado com sucesso'
        });
    } catch (error: any) {
        console.error('[Templates] Error activating:', error);
        console.error('[Templates] Error code:', error.code);
        console.error('[Templates] Error message:', error.message);
        res.status(500).json({
            success: false,
            error: 'Erro ao ativar treino',
            details: error.message
        });
    }
});

/**
 * DELETE /templates/:id
 * Exclui um treino
 */
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { id } = req.params;

        const success = await templateService.deleteTemplate(id, userId);

        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Treino não encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Treino excluído com sucesso'
        });
    } catch (error) {
        console.error('[Templates] Error deleting:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao excluir treino'
        });
    }
});

export default router;
