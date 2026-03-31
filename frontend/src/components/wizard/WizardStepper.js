import React from 'react';
import '../../styles/components/wizard.css';

const WizardStepper = ({ steps, currentStep, onStepClick }) => {
  return (
    <div className="wizard-stepper">
      <div className="stepper-container">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isClickable = onStepClick && (isCompleted || isActive);

          return (
            <div
              key={step.id}
              className={`stepper-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isClickable ? 'clickable' : ''}`}
              onClick={() => isClickable && onStepClick(index)}
            >
              <div className="step-number">
                {isCompleted ? '✓' : index + 1}
              </div>
              <div className="step-info">
                <div className="step-title">{step.title}</div>
                <div className="step-description">{step.description}</div>
              </div>
              {index < steps.length - 1 && (
                <div className="step-connector"></div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="step-progress">
        <div 
          className="progress-bar"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};

export default WizardStepper;