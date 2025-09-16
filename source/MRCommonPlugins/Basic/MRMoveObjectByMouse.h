#pragma once
#include "MRViewer/MRStatePlugin.h"
#include "MRViewer/MRMoveObjectByMouseImpl.h"
#include "MRViewer/MRUIStyle.h"
#include "MRMesh/MRPlane3.h"
#include "MRMesh/MRAffineXf3.h"
#include "MRCommonPlugins/exports.h"
#include "imgui.h"

namespace MR
{

class Object;

class MoveObjectByMouse : public StateListenerPlugin<DragStartListener, DragListener, DragEndListener, PostDrawListener>
{
public:
    MoveObjectByMouse();
    ~MoveObjectByMouse();

    MRCOMMONPLUGINS_API static MoveObjectByMouse* instance();

    // Setters to control mode/target from external UI (e.g., WASM)
    // XfMode: 0-Move, 1-Rotate, 2-Scale
    MRCOMMONPLUGINS_API void setMode( int mode );
    // XfTarget: 0-Picked, 1-Selected
    MRCOMMONPLUGINS_API void setTarget( int target );

    // Control whether to draw ImGui dialog window (HTML replaces it in WASM)
    MRCOMMONPLUGINS_API void setDialogVisible( bool visible ) { dialogVisible_ = visible; }

    virtual bool onDisable_() override;
    virtual void drawDialog( float menuScaling, ImGuiContext* ) override;

    virtual bool blocking() const override { return false; };

private:
    // Transformation mode
    enum class XfMode { Move, Rotate, Scale };
    // Transformation target: pick an object or move selected object(s)
    enum class XfTarget { Picked, Selected };

    virtual bool onDragStart_( MouseButton btn, int modifiers ) override;
    virtual bool onDrag_( int x, int y ) override;
    virtual bool onDragEnd_( MouseButton btn, int modifiers ) override;
    virtual void postDraw_() override;

    // Same as basic implementation but allows to move selected objects together by holding Shift
    class MoveObjectByMouseWithSelected : public MoveObjectByMouseImpl
    {
    protected:
        virtual ObjAndPick pickObjects_( std::vector<std::shared_ptr<Object>>& objects, int modifiers ) const override;
        virtual TransformMode modeFromPickModifiers_( int modifiers ) const override;
        virtual void setStartPoint_( const ObjAndPick& pick, Vector3f& startPoint ) const override;
    public:
        // Options are provided externally rather than directly from modifiers
        UI::RadioButtonOrModifierState modXfMode{};    // XfMode
        UI::RadioButtonOrModifierState modXfTarget{};  // XfTarget
    } moveByMouse_;

    bool dialogVisible_{ true };
};

}
