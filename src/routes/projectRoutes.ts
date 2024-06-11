import { Router } from "express";
import { ProjectController } from "../controllers/ProjectController";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middlewares/validation";
import { TaskController } from "../controllers/TaskController";
import { validateProjectExists } from "../middlewares/project";
import { hasAuthorization, taskBelongsToProject, validateTaskExists } from "../middlewares/task";
import { authenticate } from "../middlewares/auth";
import { TeamMemberController } from "../controllers/TeamController";
import { NoteController } from "../controllers/NoteController";


const router = Router()

router.use(authenticate)

router.post("/",
    body("projectName")
        .notEmpty().withMessage("El nombre del proyecto es obligatorio"),
        body("clientName")
        .notEmpty().withMessage("El nombre del cliente es obligatorio"),
        body("description")
        .notEmpty().withMessage("La descripción es obligatoria"),
    handleInputErrors,
    ProjectController.createProject
)

router.get("/", ProjectController.getAllProjects)

router.get("/:id",
    param("id").isMongoId().withMessage("Id no válido"),
    handleInputErrors,
    ProjectController.getProjectById
)

router.param("projectId", validateProjectExists)

router.put("/:projectId",
    param("projectId").isMongoId().withMessage("Id no válido"),
    body("projectName")
        .notEmpty().withMessage("El nombre del Proyecto es obligatorio"),
    body("clientName")
        .notEmpty().withMessage("El nombre del cliente es obligatorio"),
    body("description")
        .notEmpty().withMessage("La descripción es obligatoria"),
    handleInputErrors,
    hasAuthorization,
    ProjectController.updateProject
)

router.delete("/:projectId",
    param("projectId").isMongoId().withMessage("Id no válido"),
    handleInputErrors,
    hasAuthorization,
    ProjectController.deleteProject
)


// Routes for Tasks
router.post("/:projectId/tasks",
    hasAuthorization,
    body("name")
        .notEmpty().withMessage("El nombre de la tarea es obligatorio"),
    body("description")
        .notEmpty().withMessage("La descripción es obligatoria"),
    handleInputErrors,
    TaskController.CreateTask
)

router.get("/:projectId/tasks",
    TaskController.getProjectTasks
)


router.param("taskId", validateTaskExists)
router.param("taskId", taskBelongsToProject)

router.get("/:projectId/tasks/:taskId",
    param("taskId").isMongoId().withMessage("Id no válido"),
    handleInputErrors,
    TaskController.getTaskById
)

router.put("/:projectId/tasks/:taskId",
    hasAuthorization,
    param("taskId").isMongoId().withMessage("Id no válido"),
    body("name")
        .notEmpty().withMessage("El nombre de la tarea es obligatorio"),
    body("description")
        .notEmpty().withMessage("La descripción es obligatoria"),
    handleInputErrors,
    TaskController.updateTask
)

router.delete("/:projectId/tasks/:taskId",
    hasAuthorization,
    param("taskId").isMongoId().withMessage("Id no válido"),
    handleInputErrors,
    TaskController.deleteTask
)

router.post("/:projectId/tasks/:taskId/status",
    param("taskId").isMongoId().withMessage("Id no válido"),
    body("status")
        .notEmpty().withMessage("El status es obligatorio"),
    handleInputErrors,
    TaskController.updateStatus
)


// Routes for teams
router.post("/:projectId/team/find",
    body("email")
        .isEmail().toLowerCase().withMessage("Email no válido"),
    handleInputErrors,
    TeamMemberController.findMemberByEmail
)

router.post("/:projectId/team",
    body("id")
        .isMongoId().withMessage("Id no válido"),
    handleInputErrors,
    TeamMemberController.addMemberById
)

router.delete("/:projectId/team/:userId",
    param("userId")
        .isMongoId().withMessage("Id no válido"),
    handleInputErrors,
    TeamMemberController.deleteMemberById
)

router.get("/:projectId/team",
    TeamMemberController.getAllMembers
)


// Routes for notes
router.post("/:projectId/tasks/:taskId/notes",
    body("content")
        .notEmpty().withMessage("El contenido de la nota es obligatorio"),
    handleInputErrors,
    NoteController.createNote
)

router.get("/:projectId/tasks/:taskId/notes",
    NoteController.getTaskNotes
)

router.delete("/:projectId/tasks/:taskId/notes/:noteId",
    param("noteId")
        .isMongoId().withMessage("Id no válido"),
    NoteController.deleteTaskNote
)

export default router