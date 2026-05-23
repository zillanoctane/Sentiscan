from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, JSON, Numeric, func
from sqlalchemy.orm import relationship
from ..database import Base


class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(190))
    test_size = Column(Numeric(3, 2), default=0.20)
    knn_k = Column(Integer, default=5)
    nb_metrics = Column(JSON)
    knn_metrics = Column(JSON)
    best_algorithm = Column(Enum("naive_bayes", "knn", name="best_algo"), nullable=False)
    duration_sec = Column(Numeric(6, 2))
    created_at = Column(DateTime, server_default=func.now())

    owner = relationship("User", back_populates="experiments")
    dataset = relationship("Dataset", back_populates="experiments")
