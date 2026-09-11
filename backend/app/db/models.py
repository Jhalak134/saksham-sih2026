"""
models.py

SQLAlchemy models matching the DatabaseERDiagram (docs/diagrams).
Hierarchy: State -> District -> Block -> Village -> {Household, Business}
Assessment links User + Village + Category + Scheme.
"""

from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from backend.app.db.session import Base


class State(Base):
    __tablename__ = "states"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    code = Column(String, nullable=False)

    districts = relationship("District", back_populates="state")


class District(Base):
    __tablename__ = "districts"

    id = Column(Integer, primary_key=True)
    state_id = Column(Integer, ForeignKey("states.id"), nullable=False)
    name = Column(String, nullable=False)

    state = relationship("State", back_populates="districts")
    blocks = relationship("Block", back_populates="district")


class Block(Base):
    __tablename__ = "blocks"

    id = Column(Integer, primary_key=True)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=False)
    name = Column(String, nullable=False)

    district = relationship("District", back_populates="blocks")
    villages = relationship("Village", back_populates="block")


class Village(Base):
    __tablename__ = "villages"

    id = Column(Integer, primary_key=True)
    block_id = Column(Integer, ForeignKey("blocks.id"), nullable=False)
    name = Column(String, nullable=False)
    latitude = Column(Float)
    longitude = Column(Float)
    population = Column(Integer)
    household_count = Column(Integer)
    literacy_rate = Column(Float)
    data_source = Column(String)
    data_year = Column(String)
    data_confidence = Column(String)   # 'High' | 'Medium' | 'Low' — set by compute_confidence.py

    block = relationship("Block", back_populates="villages")
    households = relationship("Household", back_populates="village")
    businesses = relationship("Business", back_populates="village")
    assessments = relationship("Assessment", back_populates="village")


class Household(Base):
    __tablename__ = "households"

    id = Column(Integer, primary_key=True)
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=False)
    size = Column(Integer)
    primary_occupation = Column(String)

    village = relationship("Village", back_populates="households")


class BusinessCategory(Base):
    __tablename__ = "business_categories"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    icon = Column(String)
    is_seasonal = Column(Boolean, default=False)

    businesses = relationship("Business", back_populates="category")


class Business(Base):
    __tablename__ = "businesses"

    id = Column(Integer, primary_key=True)
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("business_categories.id"))
    name = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    source = Column(String)

    village = relationship("Village", back_populates="businesses")
    category = relationship("BusinessCategory", back_populates="businesses")


class Scheme(Base):
    __tablename__ = "schemes"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    max_project_cost = Column(Float)
    max_loan_amount = Column(Float)
    interest_rate = Column(Float)
    tenure_months = Column(Integer)
    moratorium_months = Column(Integer)

    assessments = relationship("Assessment", back_populates="scheme")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    phone_or_email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    home_location = Column(String)
    default_capital = Column(Float)
    preferred_language = Column(String)

    assessments = relationship("Assessment", back_populates="user")


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("business_categories.id"), nullable=False)
    capital_input = Column(Float)
    fit_score = Column(Float)
    confidence_level = Column(String)
    project_cost = Column(Float)
    max_loan_amount = Column(Float)
    recommended_project_size = Column(Float)
    scheme_id = Column(Integer, ForeignKey("schemes.id"))
    status = Column(String, default="Exploring")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="assessments")
    village = relationship("Village", back_populates="assessments")
    scheme = relationship("Scheme", back_populates="assessments")
