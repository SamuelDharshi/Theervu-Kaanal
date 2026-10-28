import React, { useState } from "react";
import { useT } from '../i18n/LanguageContext';
import Footer from "../shared/Footer";
import NavBar from "../components/NavBar";
import { MessageSquare, Phone, User } from "lucide-react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";

const CaseCard = ({ caseData, onDragStart }) => {
    const [isCommenting, setIsCommenting] = useState(false);
    const [comment, setComment] = useState("");
    const { t } = useT();

    const getPriorityColor = (priority) => {
        switch (priority.toLowerCase()) {
            case "high":
                return "badge bg-danger";
            case "medium":
                return "badge bg-warning text-dark";
            case "low":
                return "badge bg-success";
            default:
                return "badge bg-secondary";
        }
    };

    return (
        <Card className="mb-3 shadow-sm" draggable onDragStart={(e) => onDragStart(e, caseData.id)}>
            <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                    <h5 className="card-title">{caseData.title}</h5>
                    <span className={getPriorityColor(caseData.priority)}>{t(`priority.${caseData.priority}`)}</span>
                </div>

                <p className="text-muted mb-1">{t('common.grievanceId')}: {caseData.id}</p>
                <p className="text-muted">
                    <User size={16} className="me-1" />
                    {caseData.assignedOfficer}
                </p>

                <div className="d-flex justify-content-between mt-3">
                    <Button variant="outline-secondary" size="sm" onClick={() => setIsCommenting(!isCommenting)}>
                        <MessageSquare size={16} className="me-1" />
                        {t('official.comment')}
                    </Button>
                    <Button variant="outline-primary" size="sm">
                        <Phone size={16} className="me-1" />
                        {t('nav.contact')}
                    </Button>
                </div>

                {isCommenting && (
                    <div className="mt-3">
                        <textarea
                            className="form-control"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder={t('official.commentPlaceholder')}
                            rows={2}
                        />
                        <div className="d-flex justify-content-end mt-2">
                            <Button variant="light" size="sm" onClick={() => setIsCommenting(false)}>
                                {t('common.cancel')}
                            </Button>
                            <Button variant="success" size="sm" className="ms-2" onClick={() => {
                                setComment("");
                                setIsCommenting(false);
                            }}>
                                {t('common.submit')}
                            </Button>
                        </div>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

const OfficialDashboard = () => {
    const { t } = useT();
    const [columns, setColumns] = useState({
        assigned: {
            title: "Assigned",
            cases: [
                { id: "CASE-001", title: "Water Supply Issue", priority: "High", assignedOfficer: "John Smith", department: "Water" },
                { id: "CASE-002", title: "Street Light Maintenance", priority: "Medium", assignedOfficer: "Sarah Johnson", department: "Electricity" },
            ],
        },
        inProgress: {
            title: "In Progress",
            cases: [{ id: "CASE-003", title: "Road Repair Request", priority: "High", assignedOfficer: "Mike Wilson", department: "Road" }],
        },
        resolved: {
            title: "Resolved",
            cases: [{ id: "CASE-004", title: "License Renewal Issue", priority: "Low", assignedOfficer: "Emma Davis", department: "RTO" }],
        },
    });

    const [draggedCase, setDraggedCase] = useState(null);

    const handleDragStart = (e, caseId) => {
        setDraggedCase(caseId);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, columnId) => {
        e.preventDefault();
        if (!draggedCase) return;

        let sourceColumn, caseData;
        Object.entries(columns).forEach(([colId, column]) => {
            const foundCase = column.cases.find((c) => c.id === draggedCase);
            if (foundCase) {
                sourceColumn = colId;
                caseData = foundCase;
            }
        });

        if (sourceColumn === columnId) return;

        setColumns((prev) => ({
            ...prev,
            [sourceColumn]: {
                ...prev[sourceColumn],
                cases: prev[sourceColumn].cases.filter((c) => c.id !== draggedCase),
            },
            [columnId]: {
                ...prev[columnId],
                cases: [...prev[columnId].cases, caseData],
            },
        }));

        setDraggedCase(null);
    };

    return (
        <>
            <NavBar />
            <Container fluid className="p-4">
                {/* Dashboard Header */}
                <div className="mb-4">
                    <h2>{t('official.boardTitle')}</h2>
                    <p className="text-muted">{t('official.boardLede')}</p>
                </div>

                {/* Kanban Board */}
                <Row className="d-flex flex-nowrap overflow-auto">
                    {Object.entries(columns).map(([columnId, column]) => (
                        <Col key={columnId} xs={12} sm={6} md={4} className="d-flex flex-column p-2" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, columnId)}>
                            <Card className="mb-3 shadow">
                                <Card.Body className="text-center">
                                    <h5 className="mb-0">{t(`status.${columnId}`)}</h5>
                                    <span className="badge bg-secondary">{column.cases.length}</span>
                                </Card.Body>
                            </Card>

                            {column.cases.map((caseData) => (
                                <CaseCard key={caseData.id} caseData={caseData} onDragStart={handleDragStart} />
                            ))}
                        </Col>
                    ))}
                </Row>
            </Container>
            <Footer />
        </>
    );
};

export default OfficialDashboard;
