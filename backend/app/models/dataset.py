from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import relationship
from ..database import Base


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(190), nullable=False)
    source = Column(Enum("scrape", "upload", "customer", name="dataset_source"), nullable=False)
    source_url = Column(String(500), nullable=True)
    total_reviews = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())

    owner = relationship("User", back_populates="datasets")
    reviews = relationship("Review", back_populates="dataset", cascade="all, delete-orphan")
    experiments = relationship("Experiment", back_populates="dataset", cascade="all, delete-orphan")
