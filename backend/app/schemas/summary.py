import uuid
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class SummaryType(str, Enum):
    KEY_POINTS_AND_FORMULAS = "KEY_POINTS_AND_FORMULAS"
    EXECUTIVE_SUMMARY = "EXECUTIVE_SUMMARY"
    KEY_POINTS = "KEY_POINTS"
    FORMULA_SHEET = "FORMULA_SHEET"
    DETAILED_SUMMARY = "DETAILED_SUMMARY"


class SummaryGenerateRequest(BaseModel):
    material_id: uuid.UUID = Field(..., description="ID of the study material to summarize")
    summary_type: SummaryType = Field(
        default=SummaryType.KEY_POINTS_AND_FORMULAS,
        description="Type of summary to generate",
    )

    model_config = ConfigDict(from_attributes=True)


class SummaryResponse(BaseModel):
    material_id: uuid.UUID
    summary_type: SummaryType
    executive_summary: str
    key_takeaways: list[str]
    formula_index: list[str]

    model_config = ConfigDict(from_attributes=True)
