import type { Request, Response } from "express"
import Project from "../models/project"

export class ProjectController {
    
    static createProject = async (req: Request, res: Response) => {
        const project = new Project(req.body)

        // Asignar Manager
        project.manager = req.user.id

        try {
            await project.save()
        } catch (error) {
            console.log(error)
        }
        res.send("Proyecto creado exitosamente")
    }
    
    static getAllProjects = async (req: Request, res: Response) => {

        try {
            const projects = await Project.find({
                $or: [
                    {manager: {$in: req.user.id}},
                    {team: {$in: req.user.id}}
                ]
            })
            res.json(projects)
        } catch (error) {
            console.log(error)
        }
    }

    static getProjectById = async (req: Request, res: Response) => {
        const {id} = req.params

        try {
            const project = await Project.findById(id).populate("tasks")
            if(!project) {
                const error = new Error("Proyecto no encontrado")
                return res.status(404).json({error: error.message})
            }
            if (project.manager.toString() !== req.user.id.toString() && !project.team.includes(req.user.id)) {
                const error = new Error("Acción no válida")
                return res.status(400).json({error: error.message})
            }
            res.json(project)
        } catch (error) {
            console.log(error)
        }
    }

    static updateProject = async (req: Request, res: Response) => {
        try {

            req.project.projectName = req.body.projectName
            req.project.clientName = req.body.clientName
            req.project.description = req.body.description
            await req.project.save()
            res.send("El proyecto ha sido actualizado con éxito")
        } catch (error) {
            console.log(error)
        }
    }

    static deleteProject = async (req: Request, res: Response) => {
        try {
            await req.project.deleteOne()
            res.send("Project eliminado exitosamente")
        } catch (error) {
            console.log(error)
        }
    }

}